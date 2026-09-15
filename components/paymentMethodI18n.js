const PAYMENT_METHOD_TRANSLATIONS = Object.freeze({
  en: {
    title: 'Payment', description: 'Choose a payment method', nowLabel: 'NOWPayments', walletLabel: 'Quantum Wallet',
    toPay: 'To pay', balance: 'Balance', loading: 'Checking price and balance securely…', processing: 'Confirming purchase',
    processingDetail: 'The secure contour is debiting QCoin and activating your purchase.', successVip: 'VIP activated',
    successAds: 'Advertising package activated', successDetail: 'The purchase is active and the QCoin transaction has been confirmed.',
    insufficientTitle: 'Insufficient QCoin balance', insufficientDetail: 'Top up your balance in Quantum Wallet and try again.',
    topUp: 'Top up balance', tryAgain: 'Try again', done: 'Done', close: 'Close',
    errorTitle: 'Payment is temporarily unavailable', errorDetail: 'The secure check could not be completed. Please try again.',
    nowAria: 'Pay with NOWPayments', qcoinAria: 'Pay with QCoin from Quantum Wallet',
  },
  ru: {
    title: 'Оплата', description: 'Выберите способ оплаты', nowLabel: 'NOWPayments', walletLabel: 'Quantum Wallet',
    toPay: 'К оплате', balance: 'Баланс', loading: 'Безопасно проверяем цену и баланс…', processing: 'Подтверждаем покупку',
    processingDetail: 'Защищённый контур списывает QCoin и активирует покупку.', successVip: 'VIP активирован',
    successAds: 'Рекламный пакет активирован', successDetail: 'Покупка уже действует, транзакция QCoin подтверждена.',
    insufficientTitle: 'Недостаточно QCoin', insufficientDetail: 'Пополните баланс в Quantum Wallet и повторите покупку.',
    topUp: 'Пополнить баланс', tryAgain: 'Повторить', done: 'Готово', close: 'Закрыть',
    errorTitle: 'Оплата временно недоступна', errorDetail: 'Не удалось завершить защищённую проверку. Попробуйте ещё раз.',
    nowAria: 'Оплатить через NOWPayments', qcoinAria: 'Оплатить QCoin из Quantum Wallet',
  },
  uk: {
    title: 'Оплата', description: 'Оберіть спосіб оплати', nowLabel: 'NOWPayments', walletLabel: 'Quantum Wallet',
    toPay: 'До сплати', balance: 'Баланс', loading: 'Безпечно перевіряємо ціну та баланс…', processing: 'Підтверджуємо покупку',
    processingDetail: 'Захищений контур списує QCoin та активує покупку.', successVip: 'VIP активовано',
    successAds: 'Рекламний пакет активовано', successDetail: 'Покупка вже діє, транзакцію QCoin підтверджено.',
    insufficientTitle: 'Недостатньо QCoin', insufficientDetail: 'Поповніть баланс у Quantum Wallet і повторіть покупку.',
    topUp: 'Поповнити баланс', tryAgain: 'Повторити', done: 'Готово', close: 'Закрити',
    errorTitle: 'Оплата тимчасово недоступна', errorDetail: 'Не вдалося завершити захищену перевірку. Спробуйте ще раз.',
    nowAria: 'Сплатити через NOWPayments', qcoinAria: 'Сплатити QCoin із Quantum Wallet',
  },
  es: {
    title: 'Pago', description: 'Elige un método de pago', nowLabel: 'NOWPayments', walletLabel: 'Quantum Wallet',
    toPay: 'A pagar', balance: 'Saldo', loading: 'Comprobando el precio y el saldo de forma segura…', processing: 'Confirmando la compra',
    processingDetail: 'El sistema seguro descuenta QCoin y activa tu compra.', successVip: 'VIP activado',
    successAds: 'Paquete publicitario activado', successDetail: 'La compra está activa y la transacción de QCoin está confirmada.',
    insufficientTitle: 'Saldo de QCoin insuficiente', insufficientDetail: 'Recarga el saldo en Quantum Wallet e inténtalo de nuevo.',
    topUp: 'Recargar saldo', tryAgain: 'Reintentar', done: 'Listo', close: 'Cerrar',
    errorTitle: 'El pago no está disponible temporalmente', errorDetail: 'No se pudo completar la comprobación segura. Inténtalo de nuevo.',
    nowAria: 'Pagar con NOWPayments', qcoinAria: 'Pagar con QCoin desde Quantum Wallet',
  },
  zh: {
    title: '支付', description: '选择支付方式', nowLabel: 'NOWPayments', walletLabel: 'Quantum Wallet',
    toPay: '应付', balance: '余额', loading: '正在安全核对价格和余额…', processing: '正在确认购买',
    processingDetail: '安全系统正在扣除 QCoin 并激活购买内容。', successVip: 'VIP 已激活', successAds: '广告套餐已激活',
    successDetail: '购买已生效，QCoin 交易已确认。', insufficientTitle: 'QCoin 余额不足',
    insufficientDetail: '请在 Quantum Wallet 中充值后重试。', topUp: '充值余额', tryAgain: '重试', done: '完成', close: '关闭',
    errorTitle: '支付暂时不可用', errorDetail: '无法完成安全检查，请重试。', nowAria: '使用 NOWPayments 支付',
    qcoinAria: '使用 Quantum Wallet 中的 QCoin 支付',
  },
  ar: {
    title: 'الدفع', description: 'اختر طريقة الدفع', nowLabel: 'NOWPayments', walletLabel: 'Quantum Wallet',
    toPay: 'المبلغ المستحق', balance: 'الرصيد', loading: 'جارٍ التحقق الآمن من السعر والرصيد…', processing: 'جارٍ تأكيد الشراء',
    processingDetail: 'يقوم المسار الآمن بخصم QCoin وتفعيل عملية الشراء.', successVip: 'تم تفعيل VIP',
    successAds: 'تم تفعيل باقة الإعلانات', successDetail: 'أصبحت عملية الشراء فعّالة وتم تأكيد معاملة QCoin.',
    insufficientTitle: 'رصيد QCoin غير كافٍ', insufficientDetail: 'اشحن رصيدك في Quantum Wallet ثم حاول مرة أخرى.',
    topUp: 'شحن الرصيد', tryAgain: 'إعادة المحاولة', done: 'تم', close: 'إغلاق',
    errorTitle: 'الدفع غير متاح مؤقتًا', errorDetail: 'تعذر إكمال التحقق الآمن. حاول مرة أخرى.',
    nowAria: 'الدفع عبر NOWPayments', qcoinAria: 'الدفع باستخدام QCoin من Quantum Wallet',
  },
  tr: {
    title: 'Ödeme', description: 'Ödeme yöntemini seçin', nowLabel: 'NOWPayments', walletLabel: 'Quantum Wallet',
    toPay: 'Ödenecek', balance: 'Bakiye', loading: 'Fiyat ve bakiye güvenli biçimde kontrol ediliyor…', processing: 'Satın alma onaylanıyor',
    processingDetail: 'Güvenli sistem QCoin bakiyesini düşüyor ve satın almayı etkinleştiriyor.', successVip: 'VIP etkinleştirildi',
    successAds: 'Reklam paketi etkinleştirildi', successDetail: 'Satın alma etkin ve QCoin işlemi onaylandı.',
    insufficientTitle: 'QCoin bakiyesi yetersiz', insufficientDetail: 'Quantum Wallet bakiyenizi yükleyip tekrar deneyin.',
    topUp: 'Bakiye yükle', tryAgain: 'Tekrar dene', done: 'Tamam', close: 'Kapat',
    errorTitle: 'Ödeme geçici olarak kullanılamıyor', errorDetail: 'Güvenli kontrol tamamlanamadı. Lütfen tekrar deneyin.',
    nowAria: 'NOWPayments ile öde', qcoinAria: 'Quantum Wallet üzerinden QCoin ile öde',
  },
})

export const PAYMENT_METHOD_LANGS = Object.freeze(['ru', 'en', 'zh', 'uk', 'ar', 'tr', 'es'])

export function paymentMethodText(lang, key) {
  const locale = PAYMENT_METHOD_LANGS.includes(lang) ? lang : 'en'
  return PAYMENT_METHOD_TRANSLATIONS[locale]?.[key] || PAYMENT_METHOD_TRANSLATIONS.en[key] || key
}

export default PAYMENT_METHOD_TRANSLATIONS
