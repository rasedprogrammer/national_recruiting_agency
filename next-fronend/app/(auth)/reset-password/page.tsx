import React, { Suspense } from "react";
import ResetPassword from "./_reset-password";

const Page = () => {
  return (
    <Suspense>
      <ResetPassword />;
    </Suspense>
  );
};

export default Page;
