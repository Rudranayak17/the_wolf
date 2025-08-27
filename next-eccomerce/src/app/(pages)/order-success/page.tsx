import { OrderSuccess } from '@/components/page/OrderSuccess';
import React, { Suspense } from 'react';

const Page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderSuccess />
    </Suspense>
  );
};

export default Page;