/// <reference path="../types.d.ts"/>
/// <reference path="../../types.d.ts"/>

import { Filter } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions/v2';
import { db } from './firestore';
import Subscriptions from './firestore/Subscriptions';
import Stores from './firestore/Stores';
import MonthlyExpenses from './firestore/MonthlyExpenses';
import Cards from './firestore/Cards';
import Expenses from './firestore/Expenses';

/** @type {Collection<UserMonthlyExpenseDBData>} */
// @ts-ignore
const userMonthlyExpensesCollection = db.collection('monthlyExpenses');

/**
 * @param {UserExpenseDBData} userExpenseDBData
 * @returns {Promise<UserMonthlyExpense>}
 */
const getUserMonthlyExpenseFromUserExpenseDBData = async (
  userExpenseDBData
) => {
  const { userId, buyDate: timestamp } = userExpenseDBData;
  const date = timestamp.toDate();
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();

  const querySnapshot = await userMonthlyExpensesCollection
    .where(Filter.where('month', '==', month))
    .where(Filter.where('year', '==', year))
    .where(Filter.where('userId', '==', userId))
    .get();

  const docs = querySnapshot.docs;

  if (!docs.length) {
    return {
      id: null,
      userId,
      month,
      year,
      value: 0,
    };
  }

  const userMonthlyExpenseDoc = querySnapshot.docs[0];

  const userMonthlyExpenseDBData = userMonthlyExpenseDoc.data();

  return {
    ...userMonthlyExpenseDBData,
    id: userMonthlyExpenseDoc.id,
  };
};

/**
 * @param {UserExpenseDBData} userExpenseDBData
 * @param {boolean?} increment
 */
const updateMonthlyExpenses = async (userExpenseDBData, increment = true) => {
  const { paymentType, cardId } = userExpenseDBData;
  const isImmediateExpense = paymentType === 'CASH' || paymentType === 'DEBIT';

  if (isImmediateExpense) {
    const monthlyExpense = await getUserMonthlyExpenseFromUserExpenseDBData(
      userExpenseDBData
    );

    if (increment) {
      monthlyExpense.value += userExpenseDBData.value;
    } else {
      monthlyExpense.value -= userExpenseDBData.value;
    }

    await MonthlyExpenses.save(monthlyExpense);
  } else {
    const card = await Cards.getCardById(/** @type {string} */ (cardId));
    const { lastBuyDay } = card;
    const {
      buyDate: buyTimestamp,
      partsCount,
      isInstallment,
      userId,
      value,
    } = userExpenseDBData;
    const buyDate = buyTimestamp.toDate();
    const buyMonth = buyDate.getUTCMonth();
    const buyDay = buyDate.getUTCDate();
    const buyYear = buyDate.getUTCFullYear();

    let month = buyMonth;
    let year = buyYear;

    const incrementMonth = () => {
      month++;

      if (month === 12) {
        month = 0;
        year++;
      }
    };

    if (buyDay > lastBuyDay) {
      incrementMonth();
    }

    const partsTotal = isInstallment ? partsCount : 1;
    const partValue = value / partsTotal;

    for (let i = 0; i < partsTotal; i++) {
      const monthlyExpense = await MonthlyExpenses.getByMonthAndYear(
        userId,
        month,
        year
      );

      if (increment) {
        monthlyExpense.value += partValue;
      } else {
        monthlyExpense.value -= partValue;
      }

      await MonthlyExpenses.save(monthlyExpense);

      incrementMonth();
    }
  }
};

exports.addExpense = functions.https.onCall(
  /**
   * @param {FunctionCall<AddExpenseRequest>} request
   */
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Request is not authenticated'
      );
    }

    const data = request.data;
    const userId = request.auth.uid;

    /** @type {Expense} */
    const expense = {
      ...data,
      buyDate: new Date(data.buyDate),
    };

    await Expenses.add(userId, expense);
  }
);

exports.addCard = functions.https.onCall(
  /**
   * @param {FunctionCall<AddCardRequest>} request
   * @returns {Promise<AddCardResponse>}
   */
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Request is not authenticated'
      );
    }

    const card = request.data;
    const userId = request.auth.uid;
    const userCard = await Cards.add(userId, card);

    return userCard;
  }
);

exports.addStore = functions.https.onCall(
  /**
   * @param {FunctionCall<AddStoreRequest>} request
   * @returns {Promise<AddStoreResponse>}
   */
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Request is not authenticated'
      );
    }

    const store = request.data;
    const userId = request.auth.uid;
    const userStore = await Stores.add(userId, store);

    return userStore;
  }
);

exports.addSubscription = functions.https.onCall(
  /**
   * @param {FunctionCall<AddSubscriptionRequest>} request
   * @returns {Promise<AddSubscriptionResponse>}
   */
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Request is not authenticated'
      );
    }

    const subscription = request.data;
    const userId = request.auth.uid;
    const userSubscription = Subscriptions.add(userId, subscription);

    return userSubscription;
  }
);

// @ts-ignore
exports.onUserExpenseCreated = functions.firestore.onDocumentCreated(
  'expenses/{docId}',
  /**
   * @param {CreateEvent<UserExpenseDBData>} event
   */
  async (event) => {
    const userExpenseDBData = event.data.data();

    await updateMonthlyExpenses(userExpenseDBData);
  }
);

// @ts-ignore
exports.onUserExpenseDeleted = functions.firestore.onDocumentDeleted(
  'expenses/{docId}',
  /**
   * @param {DeleteEvent<UserExpenseDBData>} event
   */
  async (event) => {
    const userExpenseDBData = event.data.data();

    await updateMonthlyExpenses(userExpenseDBData, false);
  }
);

// @ts-ignore
exports.onUserExpenseUpdated = functions.firestore.onDocumentUpdated(
  'expenses/{docId}',
  /**
   * @param {UpdateEvent<UserExpenseDBData>} event
   */
  async (event) => {
    const beforeUserExpenseDBData = event.data.before.data();
    const afterUserExpenseDBData = event.data.after.data();

    await updateMonthlyExpenses(beforeUserExpenseDBData, false);
    await updateMonthlyExpenses(afterUserExpenseDBData);
  }
);
