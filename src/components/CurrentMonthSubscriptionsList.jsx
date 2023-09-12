import { Card, Grid, List, ListItem, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { currentMonthSubscriptionsListener } from '../firebase/firestore';
import { AuthenticationContext } from '../providers/AuthenticationProvider';
import useSubscriptions from '../providers/useSubscriptions';
import formatSubscriptionDate from '../usecases/formatSubscriptionDate';
import PriceText from './PriceText';
import ViewAllCurrentMonthSubscriptionsButton from './ViewAllCurrentMonthSubscriptionsButton';

const CurrentMonthSubscriptionsList = () => {
  const { currentMonthSubscriptionsCount } = useSubscriptions();
  const { authenticatedUserId } = useContext(AuthenticationContext);

  const [currentMonthSubscriptions, setCurrentMonthSubscriptions] = useState(
    /** @type {UserSubscription[]} */ ([])
  );

  const hasAnySubscription = currentMonthSubscriptions.length > 0;
  const hasManySubscriptions = currentMonthSubscriptionsCount > 5;

  useEffect(() => {
    const unsubscribe = currentMonthSubscriptionsListener(
      authenticatedUserId,
      (subscriptions) => {
        setCurrentMonthSubscriptions(subscriptions);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [authenticatedUserId]);

  return (
    <Grid container direction="column">
      <Grid item>
        <Typography variant="h6">{`This month's subscriptions`}</Typography>
      </Grid>

      <Grid item>
        <List
          sx={{
            width: '100%',
            bgcolor: 'background.paper',
          }}
        >
          <Card variant="outlined">
            {currentMonthSubscriptions.map((userSubscription) => {
              const { id, value } = userSubscription;

              return (
                <ListItem key={id} divider>
                  <Grid container spacing={1}>
                    <Grid item>
                      <PriceText value={value} />
                    </Grid>
                    <Grid
                      item
                      sx={{
                        flexGrow: 1,
                        display: 'flex',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Typography variant="body2">
                        {formatSubscriptionDate(userSubscription)}
                      </Typography>
                    </Grid>
                  </Grid>
                </ListItem>
              );
            })}
            {!hasAnySubscription ? (
              <Grid
                container
                direction="column"
                sx={{ p: 3 }}
                justifyContent="center"
                alignItems="center"
              >
                <Grid item>
                  <Typography variant="body1">
                    <i>There are no subscriptions</i>
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant="body1">
                    <i>to be paid this month</i>
                  </Typography>
                </Grid>
              </Grid>
            ) : null}
            {hasManySubscriptions ? (
              <ListItem>
                <Grid container justifyContent="flex-end">
                  <ViewAllCurrentMonthSubscriptionsButton />
                </Grid>
              </ListItem>
            ) : null}
          </Card>
        </List>
      </Grid>
    </Grid>
  );
};

export default CurrentMonthSubscriptionsList;
