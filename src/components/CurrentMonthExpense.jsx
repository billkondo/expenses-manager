import { Grid, Typography } from '@mui/material';
import { useContext, useEffect, useMemo, useState } from 'react';
import {
  currentMonthExpenseListener,
  fixedCostListener,
  monthlyFixedCostsListener,
} from '../firebase/firestore';
import { AuthenticationContext } from '../providers/AuthenticationProvider';

const CurrentMonthExpense = () => {
  const { authenticatedUserId } = useContext(AuthenticationContext);
  const [currentMonthExpense, setCurrentMonthExpense] = useState(
    /** @type {UserMonthlyExpense} */ (null)
  );
  const [fixedCost, setFixedCost] = useState(/** @type {FixedCost} */ (null));
  const [monthlyFixedCost, setMonthlyFixedCost] = useState(
    /** @type {UserMonthlyFixedCost} */ (null)
  );

  const expense = useMemo(() => {
    let cost = 0;

    if (currentMonthExpense) {
      cost += currentMonthExpense.value;
    }

    if (fixedCost) {
      cost += fixedCost.value;
    }

    if (monthlyFixedCost) {
      cost += monthlyFixedCost.value;
    }

    return cost;
  }, [currentMonthExpense, fixedCost, monthlyFixedCost]);

  useEffect(() => {
    const unsubscribeMonthExpenseListener = currentMonthExpenseListener(
      authenticatedUserId,
      (currentMonthExpense) => {
        setCurrentMonthExpense(currentMonthExpense);
      }
    );

    const unsubscribeFixedCostListener = fixedCostListener(
      authenticatedUserId,
      (fixedCost) => {
        setFixedCost(fixedCost);
      }
    );

    const unsubscribeMonthlyFixedCostListener = monthlyFixedCostsListener(
      authenticatedUserId,
      (monthlyFixedCost) => {
        setMonthlyFixedCost(monthlyFixedCost);
      }
    );

    return () => {
      unsubscribeMonthExpenseListener();
      unsubscribeFixedCostListener();
      unsubscribeMonthlyFixedCostListener();
    };
  }, [authenticatedUserId]);

  return (
    <Grid container direction="column">
      <Grid container item>
        <Typography variant="h5">{`This month's expense`}</Typography>
      </Grid>
      <Grid container item>
        <Typography variant="h6">{`R$ ${expense.toFixed(2)}`}</Typography>
      </Grid>
    </Grid>
  );
};

export default CurrentMonthExpense;
