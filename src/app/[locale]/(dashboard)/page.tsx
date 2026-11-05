"use client";

import React, { Suspense } from "react";
import { StudySetCardSkeleton } from "@/components/sets";
import { HomeSwitcher } from "@/components/home/HomeSwitcher";

export default function SingleRouteHomePage() {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <StudySetCardSkeleton count={6} />
        </div>
      }
    >
      <HomeSwitcher />
    </Suspense>
  );
}
