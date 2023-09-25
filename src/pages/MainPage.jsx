import { Box, Grid } from '@mui/material';
import AddExpenseButton from '../components/AddExpenseButton';
import AddSubscriptionButton from '../components/AddSubscriptionButton';
import CurrentMonthExpense from '../components/CurrentMonthExpense';
import CurrentMonthExpensesList from '../components/CurrentMonthExpensesList';
import CurrentMonthSubscriptionsList from '../components/CurrentMonthSubscriptionsList';
import LatestMonthExpenses from '../components/LatestMonthExpenses';
import NextMonthExpenses from '../components/NextMonthExpenses';
import OngoingExpensesList from '../components/OngoingExpensesList';

const MainPage = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Grid item>
          <CurrentMonthExpense />
        </Grid>
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: -40,
            gap: 1,
            display: 'flex',
          }}
        >
          <AddExpenseButton />
          <AddSubscriptionButton />
        </Box>
      </Box>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <CurrentMonthExpensesList />
        </Grid>
        <Grid item xs={12} md={4}>
          <CurrentMonthSubscriptionsList />
        </Grid>
        <Grid item xs={12} md={4}>
          <OngoingExpensesList />
        </Grid>
      </Grid>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <LatestMonthExpenses />
        </Grid>
        <Grid item xs={12} md={4}>
          <NextMonthExpenses />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MainPage;
