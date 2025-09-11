// components/i18n.js
'use client';

import { createContext, useContext, useMemo, useState, useEffect } from 'react';

const I18nContext = createContext();

const DICTS = {
  ru: {
    brand: 'QUANTUM L7 AI',
    nav_subscribe: 'Подписка',
    nav_exchange: 'Биржа',
    nav_about: 'О нас',
    hero_title: 'Космический интеллект для аналитики',
    hero_subtitle: 'Авторизация через криптокошельки и подписи PRO/VIP.',
    hero_cta: 'Перейти к подписке',
    hero_learn_more: 'Подробнее',
    // бегущая строка (маркиза)
    marquee:
      'Quantum L7 AI — автономные аналитические агенты, многорежимные модели и риск-менеджмент уровня фондов. ' +
      'Алгоритмы распознавания трендов, кластеры сигнала, вероятностные сценарии и адаптивные SL/TP. ' +
      'Интеграция с кошельками, приватные алерты, API и white-label для команд. ' +
      'Доверяй данным — принимай решения быстрее.',
    // About
    about_h1: 'Международная аналитическая платформа нового поколения',
    about_p1:
      'Quantum L7 AI объединяет квантовое мышление и прикладной трейдинг: наши модели анализируют рынок на нескольких таймфреймах, фиксируют структуру и волатильность, формируют краткие рекомендации и сценарии управления риском.',
    about_p2:
      'Мы строим систему, которая работает для начинающих и для профессионалов: подписки PRO/VIP, приватные каналы сигналов, интеграция с кошельками и простая автоматизация рабочих процессов.',
    about_bullets_title: 'Что отличает нас',
    about_b1: '• Многослойная логика: техника, потоки, режимы рынка, вероятности.',
    about_b2: '• Квантильные уровни SL/TP и «ожидаемый ход» по активации.',
    about_b3: '• Приватные алерты: Telegram и веб-панель.',
    about_b4: '• Прозрачная архитектура и API для интеграций.',
    // Exchange
    ex_title: 'Раздел биржи — в разработке',
    ex_sub: 'Мы готовим торговый модуль с подключением кошельков и базовыми ордерами.',
    ex_notify: 'Уведомить меня',
    ex_soon: 'Скоро здесь появится живая лента и стакан. Следите за обновлениями!',
  },
  en: {
    brand: 'QUANTUM L7 AI',
    nav_subscribe: 'Subscribe',
    nav_exchange: 'Exchange',
    nav_about: 'About',
    hero_title: 'Cosmic Intelligence for Analytics',
    hero_subtitle: 'Wallet-based authorization and PRO/VIP subscriptions.',
    hero_cta: 'Go to subscription',
    hero_learn_more: 'Learn more',
    marquee:
      'Quantum L7 AI — autonomous analytics agents, multimodal models, and fund-grade risk management. ' +
      'Trend recognition, signal clusters, probabilistic scenarios, and adaptive SL/TP. ' +
      'Wallet integrations, private alerts, API, and white-label for teams. ' +
      'Trust the data — decide faster.',
    about_h1: 'A next-generation international analytics platform',
    about_p1:
      'Quantum L7 AI merges quantum-style thinking with applied trading: our models analyze multiple timeframes, detect structure and volatility, and deliver concise recommendations with risk scenarios.',
    about_p2:
      'We build a system for both beginners and pros: PRO/VIP subscriptions, private signal channels, wallet integrations, and simple workflow automation.',
    about_bullets_title: 'What makes us different',
    about_b1: '• Multilayer logic: technicals, flows, market regimes, probabilities.',
    about_b2: '• Quantile-based SL/TP and “expected move” activations.',
    about_b3: '• Private alerts via Telegram and web panel.',
    about_b4: '• Clean architecture and API for integrations.',
    ex_title: 'Exchange section — under construction',
    ex_sub: 'We are preparing a trading module with wallet connection and basic orders.',
    ex_notify: 'Notify me',
    ex_soon: 'Live tape and order book coming soon. Stay tuned!',
  },
};

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('ru');

  useEffect(() => {
    const saved = localStorage.getItem('ql7_lang');
    if (saved) setLang(saved);
  }, []);

  const t = useMemo(() => {
    const dict = DICTS[lang] ?? DICTS.ru;
    return (key) => dict[key] ?? key;
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang: (l) => {
        setLang(l);
        localStorage.setItem('ql7_lang', l);
      },
      t,
    }),
    [lang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
