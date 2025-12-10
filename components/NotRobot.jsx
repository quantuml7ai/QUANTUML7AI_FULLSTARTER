"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n";

// Конфиг таймингов
const RB_FIRST_SHOW_DELAY_MS = 3 * 60 * 1000;      // 3 секунды (для теста)
const RB_IDLE_TIMEOUT_MS = 15 * 60 * 1000;          // 5 секунд бездействия (для теста)
const RB_CHECK_TIMEOUT_MS = 60 * 1000;        // 30 секунд на проверку

// Ключи в sessionStorage
const RB_FIRST_COMPLETED_KEY = "notRobot_firstCheckCompleted";

// Куда выкидываем с сайта при фейле
const RB_DEFAULT_REDIRECT_URL = "https://www.google.com";

// Список монет (можешь подправить коды и пути)
const RB_COINS = [
  { id: 1, code: "BTC", imagePath: "/robot/1.png" },
  { id: 2, code: "ETH", imagePath: "/robot/2.png" },
  { id: 3, code: "QCOIN", imagePath: "/robot/3.png" },
  { id: 4, code: "SOL", imagePath: "/robot/4.png" },
  { id: 5, code: "LTC", imagePath: "/robot/5.png" },
  { id: 6, code: "XRP", imagePath: "/robot/6.png" },
  { id: 7, code: "DOGE", imagePath: "/robot/7.png" },
  { id: 8, code: "ADA", imagePath: "/robot/8.png" },
  { id: 9, code: "TON", imagePath: "/robot/9.png" },
  { id: 10, code: "AVAX", imagePath: "/robot/10.png" },
  { id: 11, code: "LINC", imagePath: "/robot/11.png" },
  { id: 12, code: "TETHER", imagePath: "/robot/12.png" },
];

const RB_VISIBLE_COINS_PER_ROUND = 5;

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function NotRobot() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const [rbIsOverlayOpen, setRbIsOverlayOpen] = useState(false);
  const [rbFirstCheckCompleted, setRbFirstCheckCompleted] = useState(false);
  const [rbRemainingSeconds, setRbRemainingSeconds] = useState(
    RB_CHECK_TIMEOUT_MS / 1000
  );
  const [rbStatus, setRbStatus] = useState("idle"); // idle | running | success | failed
  const [rbErrorKey, setRbErrorKey] = useState(null);

  const [rbTargetCoin, setRbTargetCoin] = useState(null);
  const [rbVisibleCoins, setRbVisibleCoins] = useState([]);

  // таймеры и трекинг активности
  const rbFirstShowTimeoutRef = useRef(null);
  const rbIdleTimeoutRef = useRef(null);
  const rbCountdownIntervalRef = useRef(null);
  const rbLastActivityRef = useRef(Date.now());

  // рефы для актуальных значений (чтобы не ловить stale state в обработчиках)
  const rbFirstCompletedRef = useRef(false);
  const rbOverlayOpenRef = useRef(false);

  // синхронизация рефов с состоянием
  useEffect(() => {
    rbFirstCompletedRef.current = rbFirstCheckCompleted;
  }, [rbFirstCheckCompleted]);

  useEffect(() => {
    rbOverlayOpenRef.current = rbIsOverlayOpen;
  }, [rbIsOverlayOpen]);

  // ====== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ======

  const rbRedirectOut = () => {
    if (typeof window !== "undefined") {
      window.location.href = RB_DEFAULT_REDIRECT_URL;
    } else {
      router.push("/");
    }
  };

  const rbClearCountdown = () => {
    if (rbCountdownIntervalRef.current) {
      clearInterval(rbCountdownIntervalRef.current);
      rbCountdownIntervalRef.current = null;
    }
  };

  const rbClearIdleTimeout = () => {
    if (rbIdleTimeoutRef.current) {
      clearTimeout(rbIdleTimeoutRef.current);
      rbIdleTimeoutRef.current = null;
    }
  };

  const rbClearFirstShowTimeout = () => {
    if (rbFirstShowTimeoutRef.current) {
      clearTimeout(rbFirstShowTimeoutRef.current);
      rbFirstShowTimeoutRef.current = null;
    }
  };

  const rbStartCheckTimer = () => {
    rbClearCountdown();
    setRbRemainingSeconds(RB_CHECK_TIMEOUT_MS / 1000);
    rbCountdownIntervalRef.current = setInterval(() => {
      setRbRemainingSeconds((prev) => {
        if (prev <= 1) {
          rbClearCountdown();
          setRbStatus("failed");
          setRbErrorKey("not_robot_error_timeout");
          setTimeout(() => {
            rbRedirectOut();
          }, 800);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const rbGenerateRound = () => {
    if (!RB_COINS.length) return;

    const targetIndex = getRandomInt(RB_COINS.length);
    const target = RB_COINS[targetIndex];

    const othersPool = RB_COINS.filter((c) => c.id !== target.id);
    const shuffled = shuffleArray(othersPool);
    const others = shuffled.slice(0, RB_VISIBLE_COINS_PER_ROUND - 1);

    const combined = shuffleArray([target, ...others]);

    // 🔥 Разносим монеты подальше друг от друга
    const positions = [];
    const MIN_DIST = 22; // минимальная дистанция между центрами монет в процентах

    const withPositions = combined.map((coin) => {
      let top;
      let left;
      let attempts = 0;

      do {
        // Чуть шире поле: 15–85% по обеим осям
        top = 15 + Math.random() * 70;
        left = 15 + Math.random() * 70;
        attempts += 1;
      } while (
        attempts < 30 &&
        positions.some((p) => {
          const dx = p.left - left;
          const dy = p.top - top;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return dist < MIN_DIST;
        })
      );

      positions.push({ top, left });

      return {
        ...coin,
        top,
        left,
      };
    });

    setRbTargetCoin(target);
    setRbVisibleCoins(withPositions);
    setRbErrorKey(null);
    setRbStatus("running");
  };

  const rbOpenOverlay = () => {
    setRbErrorKey(null);
    setRbStatus("running");
    setRbIsOverlayOpen(true);
    rbStartCheckTimer();
    rbGenerateRound();
  };

  const rbScheduleIdleCheck = () => {
    rbClearIdleTimeout();
    rbIdleTimeoutRef.current = setTimeout(() => {
      // перед запуском ещё раз проверим актуальное состояние
      if (!rbFirstCompletedRef.current) return;
      if (rbOverlayOpenRef.current) return;
      rbOpenOverlay();
    }, RB_IDLE_TIMEOUT_MS);
  };

  const rbMarkActivity = () => {
    rbLastActivityRef.current = Date.now();
    // важно — смотрим на рефы, а не на стейт
    if (rbFirstCompletedRef.current && !rbOverlayOpenRef.current) {
      rbScheduleIdleCheck();
    }
  };

  const rbHandleCoinClick = (coin) => {
    if (rbStatus !== "running" || !rbTargetCoin) return;

    if (coin.id === rbTargetCoin.id) {
      rbClearCountdown();
      setRbStatus("success");
      setRbErrorKey(null);

      try {
        if (typeof window !== "undefined" && window.sessionStorage) {
          window.sessionStorage.setItem(RB_FIRST_COMPLETED_KEY, "1");
        }
      } catch (e) {
        // ignore
      }
      setRbFirstCheckCompleted(true);
      rbFirstCompletedRef.current = true;

      setTimeout(() => {
        // закрываем оверлей
        setRbIsOverlayOpen(false);
        setRbStatus("idle");
        setRbVisibleCoins([]);
        setRbTargetCoin(null);
        setRbErrorKey(null);

        // ✅ Считаем момент закрытия — стартом отсчёта idle-таймера
        rbLastActivityRef.current = Date.now();
        rbScheduleIdleCheck(); // таймер идёт даже если юзер дальше ничего не делает
      }, 800);
    } else {
      setRbErrorKey("not_robot_error_wrong_coin");
      rbGenerateRound();
    }
  };

  // ====== INITIAL MOUNT / UNMOUNT ======

  useEffect(() => {
    console.log("[NotRobot] mount");

    let firstCompleted = false;
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        firstCompleted =
          window.sessionStorage.getItem(RB_FIRST_COMPLETED_KEY) === "1";
      }
    } catch (e) {
      // ignore
    }
    setRbFirstCheckCompleted(firstCompleted);
    rbFirstCompletedRef.current = firstCompleted;

    rbLastActivityRef.current = Date.now();

    if (!firstCompleted) {
      rbFirstShowTimeoutRef.current = setTimeout(() => {
        rbOpenOverlay();
      }, RB_FIRST_SHOW_DELAY_MS);
    } else {
      // если уже проходили — сразу включаем idle-режим
      rbScheduleIdleCheck();
    }

    const activityEvents = [
      "click",
      "scroll",
      "keydown",
      "mousemove",
      "touchstart",
      "pointerdown",
    ];

    const activityHandler = () => {
      rbMarkActivity();
    };

    if (typeof window !== "undefined") {
      activityEvents.forEach((evt) =>
        window.addEventListener(evt, activityHandler, { passive: true })
      );
    }

    return () => {
      console.log("[NotRobot] unmount");
      if (typeof window !== "undefined") {
        activityEvents.forEach((evt) =>
          window.removeEventListener(evt, activityHandler)
        );
      }
      rbClearCountdown();
      rbClearIdleTimeout();
      rbClearFirstShowTimeout();
    };
  }, []);

  // Навигация по страницам тоже считается активностью
  useEffect(() => {
    rbMarkActivity();
  }, [pathname]);

  // Блокируем скролл body при открытом оверлее
  useEffect(() => {
    if (typeof document === "undefined") return;
    const originalOverflow = document.body.style.overflow;
    if (rbIsOverlayOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalOverflow || "";
    }
    return () => {
      document.body.style.overflow = originalOverflow || "";
    };
  }, [rbIsOverlayOpen]);

  // ====== РЕНДЕР ======

  if (!rbIsOverlayOpen) {
    return null;
  }

  const rbShowError = rbErrorKey != null;
  const rbErrorText = rbErrorKey ? t(rbErrorKey) : "";
  const rbIsSuccess = rbStatus === "success";

  return (
    <>
      <div className="rb-overlay">
        <div className="rb-backdrop" />
        <div className="rb-container">
          <div className="rb-card">
            <div className="rb-header">
              <div className="rb-title">{t("not_robot_title")}</div>
              <div className="rb-subtitle">{t("not_robot_subtitle")}</div>
            </div>

            <div className="rb-instruction">
              <span className="rb-instruction-text">
                {t("not_robot_instruction")}
              </span>
              {rbTargetCoin && (
                <span className="rb-coin-tag">
                  <span className="rb-coin-code">{rbTargetCoin.code}</span>
                </span>
              )}
            </div>

            <div className="rb-target-coin-preview">
              {rbTargetCoin && (
                <>
                  <img
                    src={rbTargetCoin.imagePath}
                    alt={rbTargetCoin.code}
                    className="rb-target-coin-image"
                  />
                  <span className="rb-target-coin-label">
                    {t("not_robot_target_label")}
                  </span>
                </>
              )}
            </div>

            <div className="rb-field-wrapper">
              <div className="rb-field-bg" />
              <div className="rb-coins-layer">
                {rbVisibleCoins.map((coin) => (
                  <button
                    key={coin.id}
                    type="button"
                    className="rb-coin-button"
                    style={{
                      top: `${coin.top}%`,
                      left: `${coin.left}%`,
                    }}
                    onClick={() => rbHandleCoinClick(coin)}
                  >
                    <img
                      src={coin.imagePath}
                      alt={coin.code}
                      className="rb-coin-image"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="rb-footer">
              <div className="rb-timer">
                <span className="rb-timer-label">
                  {t("not_robot_timer_label")}
                </span>
                <span className="rb-timer-value">{rbRemainingSeconds}</span>
              </div>

              <div className="rb-status">
                {rbShowError && (
                  <div className="rb-error-text">{rbErrorText}</div>
                )}
                {rbIsSuccess && (
                  <div className="rb-success">
                    <span className="rb-success-icon">✔</span>
                    <span className="rb-success-text">
                      {t("not_robot_success")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .rb-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
        }

        .rb-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
        }

        .rb-container {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          padding: 16px;
          pointer-events: none;
        }

        .rb-card {
          position: relative;
          max-width: 400px;
          width: 200%;
          background: radial-gradient(
                circle at top left,
                rgba(255, 255, 255, 0.06),
                transparent 60%
              ),
            rgba(10, 10, 16, 0.96);
          border-radius: 20px;
          box-shadow: 0 28px 60px rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 20px 20px 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          pointer-events: auto;
        }

        .rb-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .rb-title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: #ffffff;
        }

        .rb-subtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.72);
        }

        .rb-instruction {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 2px;
        }

        .rb-instruction-text {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.88);
        }

        .rb-coin-tag {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.15),
            rgba(255, 255, 255, 0.03)
          );
        }

        .rb-coin-code {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #ffffff;
        }

        .rb-target-coin-preview {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 2px;
        }

        .rb-target-coin-image {
          width: 80px;
          height: 80px;
          object-fit: contain;
          border-radius: 999px;
          box-shadow: 0 0 10px rgba(255, 217, 0, 0);
        }

        .rb-target-coin-label {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.6);
        }

.rb-field-wrapper {
  position: relative;
  margin-top: 8px;
  border-radius: 16px;
  overflow: hidden;

  /* ✅ поле под фон 16:9, всегда целиком влазит */
  width: 100%;
  aspect-ratio: 9 / 16;
  max-width: 100%;

  border: 1px solid rgba(255, 255, 255, 0.12);
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.08),
    rgba(0, 0, 0, 0.9)
  );
}

.rb-field-bg {
  position: absolute;
  inset: 0;

  /* ✅ не режем изображение, а ужимаем целиком */
  background-image: url("/robot/robot.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.28;
  filter: saturate(1.2);
}

        .rb-coins-layer {
          position: absolute;
          inset: 0;
        }

        .rb-coin-button {
          position: absolute;
          transform: translate(-50%, -50%);
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: transform 0.14s ease-out, filter 0.14s ease-out;
        }

        .rb-coin-button:hover {
          transform: translate(-50%, -50%) scale(1.08);
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.4));
        }

        .rb-coin-button:active {
          transform: translate(-50%, -50%) scale(0.95);
        }

        .rb-coin-image {
          width: 80x;
          height: 80px;
          object-fit: contain;
        }

        .rb-footer {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .rb-timer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .rb-timer-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(255, 255, 255, 0.55);
        }

        .rb-timer-value {
          font-size: 16px;
          font-weight: 700;
          color: #f5f5f5;
          padding: 2px 10px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.18);
          min-width: 40px;
          text-align: center;
        }

        .rb-status {
          min-height: 18px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }

        .rb-error-text {
          font-size: 12px;
          color: #ff6b6b;
        }

        .rb-success {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #5cff9c;
        }

        .rb-success-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 999px;
          border: 1px solid rgba(92, 255, 156, 0.9);
          font-size: 10px;
        }

        .rb-success-text {
          font-size: 12px;
        }

        @media (max-width: 680px) {
          .rb-card {
            padding: 16px 14px 14px;
            max-width: 100%;
          }

          .rb-title {
            font-size: 18px;
          }

          .rb-subtitle,
          .rb-instruction-text {
            font-size: 12px;
          }

          .rb-field-wrapper {
            height: 600px;
              width: 100%;
             aspect-ratio: 9 / 16;
             max-width: 100%;
          }

          .rb-coin-image {
            width: 78px;
            height: 78px;
          }
        }
      `}</style>
    </>
  );
}
