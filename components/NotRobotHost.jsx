"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const RB_FIRST_SHOW_DELAY_MS = 1 * 60 * 1000; // 60 сек, не меняем

const NotRobot = dynamic(() => import("./NotRobot"), {
  ssr: false,
});

export default function NotRobotHost() {
  const [rbShouldMount, setRbShouldMount] = useState(false);
  const [rbDismissedForeverForThisPage, setRbDismissedForeverForThisPage] =
    useState(false);

  const rbFirstShowTimeoutRef = useRef(null);

  const rbHandleDone = useCallback(() => {
    // После успешного завершения навсегда выключаем до следующего reload
    setRbShouldMount(false);
    setRbDismissedForeverForThisPage(true);
  }, []);

  useEffect(() => {
    if (rbDismissedForeverForThisPage) return;

    rbFirstShowTimeoutRef.current = setTimeout(() => {
      setRbShouldMount(true);
    }, RB_FIRST_SHOW_DELAY_MS);

    return () => {
      if (rbFirstShowTimeoutRef.current) {
        clearTimeout(rbFirstShowTimeoutRef.current);
        rbFirstShowTimeoutRef.current = null;
      }
    };
  }, [rbDismissedForeverForThisPage]);

  if (rbDismissedForeverForThisPage) {
    return null;
  }

  if (!rbShouldMount) {
    return null;
  }

  return <NotRobot onDone={rbHandleDone} />;
}