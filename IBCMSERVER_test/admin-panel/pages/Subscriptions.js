import { useState, useEffect } from "react";
import { getSubscriptionPlans, deleteSubscriptionPlan } from "../services/subscriptionService";
import { Button, Table } from "../components/UIComponents";

const Subscriptions = () => {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const data = await getSubscriptionPlans();
    setPlans(data);
  };

  const handleDelete = async (planId) => {
    await deleteSubscriptionPlan(planId);
    fetchPlans();
  };

  return (
    <div>
      <h2>Subscription Management</h2>
      <Table
        headers={["Name", "Events Limit", "Price", "Duration", "Actions"]}
        data={plans.map((plan) => [
          plan.name,
          plan.eventLimit,
          `$${plan.price}`,
          plan.duration,
          <Button key={plan._id} onClick={() => handleDelete(plan._id)}>Delete</Button>,
        ])}
      />
    </div>
  );
};

export default Subscriptions;
