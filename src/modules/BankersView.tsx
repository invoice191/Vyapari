import React from "react";
import { useAuth } from "../hooks/useAuth";
import BankerStrategicView from "../components/banker/BankerStrategicView";

export default function BankersView() {
  const { profile } = useAuth();
  
  return (
    <div className="w-full">
      <BankerStrategicView businessId={profile?.business_id || "default_business"} />
    </div>
  );
}
