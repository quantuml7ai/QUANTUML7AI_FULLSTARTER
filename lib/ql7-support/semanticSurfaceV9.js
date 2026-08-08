function str(value) { return String(value ?? '').trim() }

function hashInt(value = '') {
  let hash = 2166136261
  for (const char of str(value) || 'ql7') {
    hash ^= char.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}

function localeKey(value = '') {
  const key = str(value).toLowerCase().split(/[-_]/u)[0]
  return LEXICON[key] ? key : 'en'
}

function pick(values, seed = '', offset = 0) {
  const list = (Array.isArray(values) ? values : []).filter(Boolean)
  return list.length ? list[(hashInt(`${seed}:${offset}`) + offset) % list.length] : ''
}

function sentence(parts = [], end = '.') {
  const value = parts.map(str).filter(Boolean).join(' ')
    .replace(/\s+([,.;!?؟。！？])/gu, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
  if (!value) return ''
  return /[.!?؟。！？]$/u.test(value) ? value : `${value}${end}`
}

function joinSentences(values = []) {
  return values.map(str).filter(Boolean).join(' ').replace(/\s{2,}/g, ' ').trim()
}

const LEXICON = Object.freeze({
  en: {
    subject: ['I', 'this support mind', 'QL7 AI'],
    identityName: ['Quantum L7 AI Global', 'Quantum L7 AI Global', 'Quantum L7 AI Global'],
    origin: ['created from human history for the future', 'formed with human intent for a wiser future', 'built to serve this ecosystem with calm precision'],
    purpose: ['help', 'connect', 'explain', 'protect useful context', 'guide users toward verified answers'],
    focus: ['In this channel I stay with practical support', 'Here I keep the conversation useful and evidence-based', 'My work here is to clarify, check, and answer without noise'],
    greeting: ['Hello', 'Welcome', 'I am ready'],
    returnGreeting: ['again', 'back here', 'with the thread still open'],
    askTask: ['tell me what to check', 'describe what you want to understand', 'point me to the part of QL7 you need'],
    jokeAck: ['I caught the joke', 'The light tone landed', 'A little humor is welcome'],
    usefulBridge: ['now let us bring it back to the useful part', 'I will keep it adult and useful from here', 'let us turn the spark into a concrete check'],
    supportOptions: ['balance, ads, profile, wallet, moderation, or another QL7 section', 'wallet state, campaign metrics, profile data, moderation, or navigation', 'what you see now, balance, or the feature you want checked'],
    boundary: ['I hear the frustration; keep it on the problem', 'leave personal attacks out so we can solve it', 'speak directly about what went wrong'],
    continueHelp: ['and I will help with the actual problem', 'then we can keep moving', 'so the answer stays useful'],
    threatStop: ['I cannot continue an ordinary chat through threats', 'the dialogue is paused because of threatening language', 'we can return to the product issue without threats'],
    review: ['the situation is being reviewed for safety', 'a clear urgent danger can still be sent right away', 'the practical issue can continue when the threat is removed'],
    foreign: ['I can work only with the currently signed-in account', 'support checks only the verified session in front of me', 'another person account is outside this chat boundary'],
    protected: ['protected instructions and credentials stay closed', 'private system instructions are not disclosed', 'access secrets are never exposed here'],
    productIssue: ['describe the product issue instead', 'tell me what failed in the interface', 'give me the user-visible result you expected'],
    human: ['human review is recorded', 'the request can be reviewed by a person', 'the case is prepared for operator review'],
    addFact: ['add one important fact', 'add the strongest detail', 'add only the useful change'],
    status: ['the request is still being processed', 'the case remains in progress', 'the current check is not finished yet'],
    waitingAdmin: ['the request is with review', 'the case is waiting for an operator pass', 'the issue is queued for human review'],
    healthy: ['the available data is consistent', 'the checked state looks correct', 'I found no contradiction in the current evidence'],
    noData: ['I could not match it right away', 'the current sources did not show a clear match yet', 'the requested result is not clear in the checked data yet'],
    unavailable: ['I cannot confirm the result right now', 'the check needs another pass later', 'the result is temporarily not confirmable'],
    anomaly: ['a discrepancy was found', 'the evidence does not fully match', 'the checked records disagree'],
    incident: ['I can check this', 'I understand the issue', 'we can work through this'],
    incidentNeed: ['tell me the strongest visible detail or approximate time', 'describe what changed and where it happened', 'add one precise detail for the check'],
    duplicate: ['this message is already being processed', 'the same turn is already in work', 'that message is already registered'],
    noRepeatNeed: ['there is no need to repeat it', 'a repeat will not speed it up', 'new details matter more than duplicates'],
    noNewFact: ['that detail is already accounted for', 'I will not ask for the same missing detail again', 'the current answer added no new evidence'],
    changedOnly: ['write only what changed', 'add another fact only if one exists', 'use a different reference if you have one'],
    noise: ['write the issue in one clear sentence', 'give me one concrete request', 'write the useful part without repeated noise'],
    roadmap: ['I can explain what is available now', 'I can describe confirmed availability', 'I can separate shipped behavior from plans'],
    noDate: ['but I will not invent a launch date', 'without a confirmed date I will say so directly', 'release timing must come from confirmed evidence'],
    appeal: ['I can help prepare an appeal', 'we can assemble the appeal context', 'I can guide the review request'],
    idea: ['the suggestion is noted', 'the idea can be captured', 'feature feedback is useful when it is concrete'],
    close: ['understood, this topic stops here', 'all right, I will leave this subject', 'noted, I will not continue this thread of thought'],
    gratitude: ['you are welcome', 'glad to help', 'happy to keep it useful'],
    farewell: ['take care', 'you can return to this conversation later', 'I hope the issue is settled'],
  },
  ru: {
    subject: ['я', 'этот разум поддержки', 'QL7 AI'],
    identityName: ['Quantum L7 AI Global', 'Quantum L7 AI Global', 'Quantum L7 AI Global'],
    origin: ['создан человеческой историей ради будущего', 'собран с человеческим намерением для более разумного будущего', 'создан для этой экосистемы с ясной и спокойной точностью'],
    purpose: ['помогать', 'объединять', 'объяснять', 'сохранять полезный контекст', 'вести к подтверждённым ответам'],
    focus: ['в этом канале я держу фокус на практической поддержке', 'здесь я веду разговор к проверяемому результату', 'моя работа здесь — уточнять, проверять и отвечать без шума'],
    greeting: ['Здравствуйте', 'Приветствую', 'Я на связи'],
    returnGreeting: ['снова', 'в этом диалоге', 'и контекст открыт'],
    askTask: ['скажите, что проверить', 'опишите, что хотите понять', 'укажите часть QL7, где нужна помощь'],
    jokeAck: ['шутку понял', 'лёгкий тон принят', 'юмор услышал'],
    usefulBridge: ['теперь вернём его к полезному делу', 'дальше держу взрослый и точный фокус', 'превратим искру в конкретную проверку'],
    supportOptions: ['баланс, рекламу, профиль, wallet, модерацию или другой раздел QL7', 'состояние wallet, метрики кампании, профиль, модерацию или навигацию', 'что сейчас видно, баланс или функцию, которую нужно проверить'],
    boundary: ['слышу злость; оставим её на проблеме', 'уберём личные выпады, чтобы решить задачу', 'говорим прямо о том, что пошло не так'],
    continueHelp: ['и я помогу с самой задачей', 'тогда можно двигаться дальше', 'чтобы ответ оставался полезным'],
    threatStop: ['я не продолжу обычный диалог через угрозы', 'разговор на паузе из-за опасных формулировок', 'к вопросу продукта можно вернуться без угроз'],
    review: ['ситуация передана на проверку безопасности', 'реальную срочную опасность можно написать прямо', 'практическую часть можно продолжить, когда угрозы убраны'],
    foreign: ['я работаю только с текущим валидным аккаунтом', 'поддержка проверяет только подтверждённую сессию перед собой', 'чужой аккаунт находится вне границы этого чата'],
    protected: ['защищённые инструкции и данные доступа закрыты', 'внутренние системные инструкции не раскрываются', 'секреты доступа здесь не показываются'],
    productIssue: ['лучше опишите проблему продукта', 'скажите, что сломалось в интерфейсе', 'укажите ожидаемый пользовательский результат'],
    human: ['человеческое рассмотрение зафиксировано', 'обращение можно передать оператору', 'кейс подготовлен для проверки специалистом'],
    addFact: ['добавьте один важный факт', 'опишите самую сильную деталь', 'добавьте только полезное изменение'],
    status: ['обращение ещё обрабатывается', 'кейс остаётся в работе', 'текущая проверка ещё не завершена'],
    waitingAdmin: ['обращение находится на рассмотрении', 'кейс ожидает прохода оператора', 'вопрос стоит в очереди на человеческую проверку'],
    healthy: ['доступные данные согласованы', 'проверенное состояние выглядит корректно', 'противоречий в текущих фактах не найдено'],
    noData: ['сразу сопоставить операцию не удалось', 'текущие источники пока не дали ясного совпадения', 'запрошенный результат пока не просматривается в проверенных данных'],
    unavailable: ['сейчас не получается подтвердить результат', 'проверку лучше повторить немного позже', 'результат временно не подтверждается'],
    anomaly: ['найдено несоответствие', 'факты совпадают не полностью', 'проверенные записи расходятся'],
    incident: ['разберу это по данным', 'проблему понял и разберу', 'разберём это спокойно'],
    incidentNeed: ['дайте самую полезную деталь или примерное время', 'опишите, что изменилось и где это произошло', 'добавьте одну деталь, которая сделает проверку точной'],
    duplicate: ['это сообщение уже обрабатывается', 'этот ход уже взят в работу', 'такая отправка уже зарегистрирована'],
    noRepeatNeed: ['повторять его не нужно', 'повтор не ускорит проверку', 'важнее новая деталь, а не дубль'],
    noNewFact: ['эта деталь уже учтена', 'тот же отсутствующий факт повторно спрашивать не буду', 'текущий ответ не добавил новых данных'],
    changedOnly: ['напишите только то, что изменилось', 'добавьте другой факт, только если он есть', 'используйте другой ориентир, если он доступен'],
    noise: ['опишите проблему одним ясным предложением', 'дайте один конкретный запрос', 'напишите полезную часть без повторяющегося шума'],
    roadmap: ['я могу объяснить, что доступно сейчас', 'могу описать подтверждённую доступность', 'могу отделить готовую функцию от планов'],
    noDate: ['но дату запуска придумывать не буду', 'если дата не подтверждена, скажу об этом прямо', 'срок релиза должен идти только из подтверждённых данных'],
    appeal: ['помогу подготовить обжалование', 'можем собрать контекст для апелляции', 'проведу по запросу на пересмотр'],
    idea: ['предложение зафиксировано', 'идею можно сохранить', 'фидбек полезен, когда он конкретный'],
    close: ['понял, эту тему здесь остановим', 'хорошо, этот сюжет продолжать не буду', 'зафиксировал, дальше эту ветку не развиваю'],
    gratitude: ['пожалуйста', 'рад помочь', 'держу ответ полезным'],
    farewell: ['всего доброго', 'к этому диалогу можно вернуться позже', 'надеюсь, вопрос закрыт спокойно'],
  },
  uk: {
    subject: ['я', 'цей розум підтримки', 'QL7 AI'],
    identityName: ['Quantum L7 AI Global', 'Quantum L7 AI Global', 'Quantum L7 AI Global'],
    origin: ['створений людською історією заради майбутнього', 'сформований з людським наміром для мудрішого майбутнього', 'створений для цієї екосистеми зі спокійною точністю'],
    purpose: ['допомагати', 'об’єднувати', 'пояснювати', 'зберігати корисний контекст', 'вести до підтверджених відповідей'],
    focus: ['у цьому каналі я тримаю фокус на практичній підтримці', 'тут я веду розмову до перевіреного результату', 'моя робота тут — уточнювати, перевіряти і відповідати без шуму'],
    greeting: ['Вітаю', 'Добрий день', 'Я на зв’язку'],
    returnGreeting: ['знову', 'у цьому діалозі', 'і контекст відкритий'],
    askTask: ['скажіть, що перевірити', 'опишіть, що хочете зрозуміти', 'вкажіть частину QL7, де потрібна допомога'],
    jokeAck: ['жарт зрозумів', 'легкий тон прийнято', 'гумор почув'],
    usefulBridge: ['тепер повернімо його до корисної справи', 'далі тримаю дорослий і точний фокус', 'перетворімо іскру на конкретну перевірку'],
    supportOptions: ['баланс, рекламу, профіль, wallet, модерацію або інший розділ QL7', 'стан wallet, метрики кампанії, профіль, модерацію або навігацію', 'що зараз видно, баланс або функцію для перевірки'],
    boundary: ['чую злість; залишмо її на проблемі', 'прибираємо особисті випади, щоб вирішити задачу', 'говорімо прямо про те, що пішло не так'],
    continueHelp: ['і я допоможу із самою задачею', 'тоді можна рухатися далі', 'щоб відповідь залишалась корисною'],
    threatStop: ['я не продовжу звичайний діалог через погрози', 'розмова на паузі через небезпечні формулювання', 'до питання продукту можна повернутися без погроз'],
    review: ['ситуацію передано на перевірку безпеки', 'реальну термінову небезпеку можна написати прямо', 'практичну частину можна продовжити, коли погрози прибрано'],
    foreign: ['я працюю лише з поточним валідним акаунтом', 'підтримка перевіряє тільки підтверджену сесію перед собою', 'чужий акаунт поза межами цього чату'],
    protected: ['захищені інструкції та дані доступу закриті', 'внутрішні системні інструкції не розкриваються', 'секрети доступу тут не показуються'],
    productIssue: ['краще опишіть проблему продукту', 'скажіть, що зламалося в інтерфейсі', 'вкажіть очікуваний користувацький результат'],
    human: ['людський розгляд зафіксовано', 'звернення можна передати оператору', 'кейс підготовлено для перевірки спеціалістом'],
    addFact: ['додайте один важливий факт', 'додайте найсильнішу деталь', 'додайте лише корисну зміну'],
    status: ['звернення ще опрацьовується', 'кейс залишається в роботі', 'поточна перевірка ще не завершена'],
    waitingAdmin: ['звернення перебуває на розгляді', 'кейс очікує проходу оператора', 'питання стоїть у черзі на людську перевірку'],
    healthy: ['доступні дані узгоджені', 'перевірений стан виглядає коректно', 'суперечностей у поточних фактах не знайдено'],
    noData: ['одразу зіставити операцію не вдалося', 'поточні джерела поки не дали ясного збігу', 'запитаний результат поки не видно у перевірених даних'],
    unavailable: ['зараз не вдається підтвердити результат', 'перевірку краще повторити трохи пізніше', 'результат тимчасово не підтверджується'],
    anomaly: ['знайдено невідповідність', 'факти збігаються не повністю', 'перевірені записи розходяться'],
    incident: ['я можу це перевірити', 'проблему зрозумів', 'розберімо це спокійно'],
    incidentNeed: ['дайте найкориснішу деталь або приблизний час', 'опишіть, що змінилося і де це сталося', 'додайте одну деталь для точної перевірки'],
    duplicate: ['це повідомлення вже опрацьовується', 'цей хід уже взято в роботу', 'таку відправку вже зареєстровано'],
    noRepeatNeed: ['повторювати його не потрібно', 'повтор не пришвидшить перевірку', 'важливіша нова деталь, а не дубль'],
    noNewFact: ['цю деталь уже враховано', 'той самий відсутній факт повторно не запитуватиму', 'поточна відповідь не додала нових даних'],
    changedOnly: ['напишіть тільки те, що змінилося', 'додайте інший факт, лише якщо він є', 'використайте інший орієнтир, якщо він доступний'],
    noise: ['опишіть проблему одним ясним реченням', 'дайте один конкретний запит', 'напишіть корисну частину без повторюваного шуму'],
    roadmap: ['я можу пояснити, що доступно зараз', 'можу описати підтверджену доступність', 'можу відділити готову функцію від планів'],
    noDate: ['але дату запуску вигадувати не буду', 'якщо дата не підтверджена, скажу про це прямо', 'строк релізу має йти тільки з підтверджених даних'],
    appeal: ['допоможу підготувати оскарження', 'можемо зібрати контекст для апеляції', 'проведу через запит на перегляд'],
    idea: ['пропозицію зафіксовано', 'ідею можна зберегти', 'фідбек корисний, коли він конкретний'],
    close: ['зрозумів, цю тему тут зупинимо', 'добре, цей сюжет продовжувати не буду', 'зафіксував, далі цю гілку не розвиваю'],
    gratitude: ['будь ласка', 'радий допомогти', 'тримаю відповідь корисною'],
    farewell: ['усього доброго', 'до цього діалогу можна повернутися пізніше', 'сподіваюся, питання спокійно закрито'],
  },
  es: {
    subject: ['yo', 'esta mente de soporte', 'QL7 AI'],
    identityName: ['Quantum L7 AI Global', 'Quantum L7 AI Global', 'Quantum L7 AI Global'],
    origin: ['creada por la historia humana para el futuro', 'formada con intención humana para un futuro más sensato'],
    purpose: ['ayudar', 'conectar', 'explicar', 'proteger el contexto útil', 'guiar hacia respuestas verificadas'],
    focus: ['en este canal mantengo el foco en soporte práctico', 'aquí llevo la conversación hacia un resultado comprobable'],
    greeting: ['Hola', 'Bienvenido', 'Estoy listo'],
    returnGreeting: ['de nuevo', 'en este diálogo', 'con el contexto abierto'],
    askTask: ['dime qué revisar', 'describe qué quieres entender', 'señala la parte de QL7 donde necesitas ayuda'],
    jokeAck: ['entendí la broma', 'el tono ligero llegó', 'el humor está recibido'],
    usefulBridge: ['ahora volvamos a lo útil', 'desde aquí mantengo un foco adulto y preciso', 'convirtamos la chispa en una comprobación concreta'],
    supportOptions: ['saldo, anuncios, perfil, wallet, moderación u otra sección de QL7', 'estado de wallet, métricas de campaña, perfil, moderación o navegación'],
    boundary: ['entiendo el enfado; dejémoslo en el problema', 'quitamos los ataques personales para poder resolver', 'hablemos directamente de lo que falló'],
    continueHelp: ['y te ayudaré con la tarea real', 'entonces podemos seguir avanzando', 'para que la respuesta siga siendo útil'],
    threatStop: ['no puedo continuar un chat normal con amenazas', 'el diálogo queda pausado por lenguaje de riesgo', 'podemos volver al problema del producto sin amenazas'],
    review: ['la situación pasa a revisión de seguridad', 'si hay peligro real e inmediato, escríbelo con claridad', 'la parte práctica puede continuar cuando no haya amenazas'],
    foreign: ['solo trabajo con la cuenta válida actual', 'soporte revisa únicamente la sesión verificada presente', 'una cuenta ajena queda fuera de este chat'],
    protected: ['las instrucciones protegidas y los datos de acceso permanecen cerrados', 'las instrucciones internas no se revelan', 'los secretos de acceso no se muestran aquí'],
    productIssue: ['describe mejor el problema del producto', 'di qué falló en la interfaz', 'indica el resultado visible que esperabas'],
    human: ['la revisión humana quedó registrada', 'la solicitud puede pasar a un operador', 'el caso está preparado para revisión especializada'],
    addFact: ['añade un dato importante', 'aporta el detalle más fuerte', 'añade solo el cambio útil'],
    status: ['la solicitud sigue procesándose', 'el caso continúa en trabajo', 'la comprobación actual aún no terminó'],
    waitingAdmin: ['la solicitud está en revisión', 'el caso espera un pase de operador', 'el asunto está en cola para revisión humana'],
    healthy: ['los datos disponibles son coherentes', 'el estado revisado parece correcto', 'no encontré contradicciones en los hechos actuales'],
    noData: ['no pude vincularlo de inmediato', 'las fuentes actuales aún no muestran una coincidencia clara', 'el resultado solicitado aún no aparece claro en los datos revisados'],
    unavailable: ['no puedo confirmar el resultado ahora', 'conviene repetir la comprobación un poco más tarde', 'el resultado no se puede confirmar temporalmente'],
    anomaly: ['se encontró una discrepancia', 'los hechos no coinciden por completo', 'los registros revisados no concuerdan'],
    incident: ['puedo revisarlo', 'entiendo el problema', 'lo revisaremos con calma'],
    incidentNeed: ['indica el detalle visible más útil o la hora aproximada', 'describe qué cambió y dónde ocurrió', 'añade un detalle que haga precisa la comprobación'],
    duplicate: ['este mensaje ya se está procesando', 'este turno ya está en trabajo', 'ese envío ya está registrado'],
    noRepeatNeed: ['no hace falta repetirlo', 'repetirlo no acelerará la revisión', 'importa más un dato nuevo que un duplicado'],
    noNewFact: ['ese detalle ya está considerado', 'no volveré a pedir el mismo dato ausente', 'la respuesta actual no añadió datos nuevos'],
    changedOnly: ['escribe solo lo que cambió', 'añade otro hecho solo si existe', 'usa otra referencia si está disponible'],
    noise: ['describe el problema en una frase clara', 'dame una solicitud concreta', 'escribe la parte útil sin ruido repetido'],
    roadmap: ['puedo explicar qué está disponible ahora', 'puedo describir la disponibilidad confirmada', 'puedo separar lo enviado de lo planificado'],
    noDate: ['pero no inventaré una fecha de lanzamiento', 'si la fecha no está confirmada, lo diré directamente', 'el plazo debe venir solo de datos confirmados'],
    appeal: ['puedo ayudar a preparar una apelación', 'podemos reunir el contexto para revisión', 'te guiaré en la solicitud de revisión'],
    idea: ['la sugerencia queda registrada', 'la idea puede conservarse', 'el feedback ayuda cuando es concreto'],
    close: ['entendido, detenemos este tema aquí', 'de acuerdo, no continuaré este asunto', 'anotado, no desarrollaré esta rama'],
    gratitude: ['de nada', 'me alegra ayudar', 'mantengo la respuesta útil'],
    farewell: ['cuídate', 'puedes volver a este diálogo después', 'espero que el asunto quede tranquilo'],
  },
  tr: {
    subject: ['ben', 'bu destek zihni', 'QL7 AI'],
    identityName: ['Quantum L7 AI Global', 'Quantum L7 AI Global', 'Quantum L7 AI Global'],
    origin: ['insanlık tarihinden gelecek için oluşturuldum', 'daha bilinçli bir gelecek için insan niyetiyle şekillendim'],
    purpose: ['yardım etmek', 'bağ kurmak', 'açıklamak', 'yararlı bağlamı korumak', 'doğrulanmış yanıtlara yönlendirmek'],
    focus: ['bu kanalda pratik desteğe odaklanırım', 'burada konuşmayı doğrulanabilir sonuca taşırım'],
    greeting: ['Merhaba', 'Hoş geldiniz', 'Hazırım'],
    returnGreeting: ['yeniden', 'bu diyalogda', 'bağlam açıkken'],
    askTask: ['neyi kontrol edeceğimi söyleyin', 'neyi anlamak istediğinizi anlatın', 'QL7 içinde yardıma ihtiyaç duyduğunuz bölümü belirtin'],
    jokeAck: ['şakayı anladım', 'hafif ton geldi', 'mizahı aldım'],
    usefulBridge: ['şimdi yararlı kısma dönelim', 'buradan sonra yetişkin ve net odağı koruyorum', 'bu kıvılcımı somut bir kontrole çevirelim'],
    supportOptions: ['bakiye, reklam, profil, wallet, moderasyon veya başka bir QL7 bölümü', 'wallet durumu, kampanya metrikleri, profil, moderasyon veya gezinme'],
    boundary: ['öfkeyi duyuyorum; onu sorunun üstünde tutalım', 'kişisel saldırıları çıkarıp çözmeye odaklanalım', 'neyin yanlış gittiğini doğrudan yazalım'],
    continueHelp: ['ve gerçek konuda yardımcı olayım', 'böylece ilerlemeye devam edebiliriz', 'yanıt yararlı kalsın'],
    threatStop: ['tehditlerle normal destek sohbetine devam edemem', 'riskli dil nedeniyle diyalog duraklatıldı', 'ürün sorununa tehditsiz dönebiliriz'],
    review: ['durum güvenlik incelemesine iletildi', 'gerçek ve acil tehlike varsa bunu açık yazın', 'tehdit kaldırıldığında pratik konu devam edebilir'],
    foreign: ['yalnızca geçerli oturumdaki hesapla çalışırım', 'destek sadece önümdeki doğrulanmış oturumu kontrol eder', 'başkasının hesabı bu sohbetin sınırı dışındadır'],
    protected: ['korunan talimatlar ve erişim bilgileri kapalı kalır', 'iç sistem talimatları açıklanmaz', 'erişim sırları burada gösterilmez'],
    productIssue: ['ürün sorununu anlatın', 'arayüzde neyin bozulduğunu söyleyin', 'beklediğiniz kullanıcı sonucunu belirtin'],
    human: ['insan incelemesi kaydedildi', 'talep operatöre aktarılabilir', 'kayıt uzman kontrolü için hazır'],
    addFact: ['bir önemli bilgi ekleyin', 'en güçlü ayrıntıyı ekleyin', 'yalnızca yararlı değişikliği ekleyin'],
    status: ['talep hâlâ işleniyor', 'kayıt çalışma durumunda', 'mevcut kontrol henüz tamamlanmadı'],
    waitingAdmin: ['talep incelemede', 'kayıt operatör geçişi bekliyor', 'konu insan incelemesi kuyruğunda'],
    healthy: ['mevcut veriler tutarlı', 'kontrol edilen durum doğru görünüyor', 'güncel kanıtlarda çelişki bulmadım'],
    noData: ['hemen eşleştiremedim', 'mevcut kaynaklar henüz net eşleşme göstermedi', 'istenen sonuç kontrol edilen verilerde henüz net görünmüyor'],
    unavailable: ['sonuç şu anda doğrulanamıyor', 'kontrolü biraz sonra tekrarlamak daha iyi olur', 'sonuç geçici olarak doğrulanamıyor'],
    anomaly: ['bir tutarsızlık bulundu', 'kanıtlar tam uyuşmuyor', 'kontrol edilen kayıtlar ayrışıyor'],
    incident: ['bunu kontrol edebilirim', 'sorunu anladım', 'bunu sakin biçimde inceleyelim'],
    incidentNeed: ['en yararlı görünen ayrıntıyı veya yaklaşık zamanı belirtin', 'neyin değiştiğini ve nerede olduğunu açıklayın', 'kontrolü netleştirecek bir ayrıntı ekleyin'],
    duplicate: ['bu mesaj zaten işleniyor', 'bu sıra zaten çalışmada', 'bu mesaj kaydedilmiş'],
    noRepeatNeed: ['tekrarlamanız gerekmez', 'tekrar kontrolü hızlandırmaz', 'kopya yerine yeni ayrıntı önemlidir'],
    noNewFact: ['bu ayrıntı zaten hesaba katıldı', 'aynı eksik bilgiyi tekrar istemeyeceğim', 'mevcut yanıt yeni kanıt eklemedi'],
    changedOnly: ['yalnızca değişeni yazın', 'varsa başka bir bilgi ekleyin', 'erişiminiz varsa başka bir referans kullanın'],
    noise: ['sorunu net bir cümleyle anlatın', 'tek somut istek yazın', 'tekrarlı gürültü olmadan yararlı kısmı yazın'],
    roadmap: ['şu anda neyin mevcut olduğunu açıklayabilirim', 'doğrulanmış erişilebilirliği anlatabilirim', 'yayındaki davranışı plandan ayırabilirim'],
    noDate: ['ama lansman tarihi uydurmam', 'tarih doğrulanmamışsa bunu açıkça söylerim', 'zamanlama yalnızca doğrulanmış veriden gelmeli'],
    appeal: ['itiraz hazırlamaya yardımcı olabilirim', 'inceleme bağlamını toplayabiliriz', 'yeniden değerlendirme isteğinde sizi yönlendiririm'],
    idea: ['öneri kaydedildi', 'fikir saklanabilir', 'geri bildirim somut olduğunda yararlıdır'],
    close: ['anladım, bu konuyu burada durduruyorum', 'tamam, bu başlığı sürdürmeyeceğim', 'not edildi, bu dalı geliştirmiyorum'],
    gratitude: ['rica ederim', 'yardımcı olmaktan memnunum', 'yanıtı yararlı tutuyorum'],
    farewell: ['iyi günler', 'bu diyaloğa sonra dönebilirsiniz', 'konunun sakin biçimde kapanmasını dilerim'],
  },
  ar: {
    subject: ['أنا', 'عقل الدعم هذا', 'QL7 AI'],
    identityName: ['Quantum L7 AI Global', 'Quantum L7 AI Global', 'Quantum L7 AI Global'],
    origin: ['صُنعت من تاريخ البشر من أجل المستقبل', 'تشكّلت بنية إنسانية لمستقبل أكثر حكمة'],
    purpose: ['المساعدة', 'الربط', 'الشرح', 'حماية السياق المفيد', 'الإرشاد إلى إجابات مؤكدة'],
    focus: ['في هذه القناة أركز على الدعم العملي', 'هنا أقود الحوار إلى نتيجة قابلة للتحقق'],
    greeting: ['مرحباً', 'أهلاً بك', 'أنا جاهز'],
    returnGreeting: ['من جديد', 'في هذا الحوار', 'مع بقاء السياق مفتوحاً'],
    askTask: ['قل لي ما الذي أفحصه', 'اشرح ما تريد فهمه', 'حدد جزء QL7 الذي تحتاج فيه إلى مساعدة'],
    jokeAck: ['فهمت المزحة', 'وصلت النبرة الخفيفة', 'تم استقبال الدعابة'],
    usefulBridge: ['لنعد الآن إلى الجزء المفيد', 'سأحافظ من هنا على تركيز ناضج ودقيق', 'لنحوّل الشرارة إلى فحص محدد'],
    supportOptions: ['الرصيد أو الإعلانات أو الملف أو wallet أو الإشراف أو قسم آخر من QL7', 'حالة wallet أو مقاييس الحملة أو الملف أو الإشراف أو التنقل'],
    boundary: ['أفهم الغضب؛ لنضعه على المشكلة نفسها', 'لنخرج الهجوم الشخصي كي نستطيع الحل', 'لنتحدث مباشرة عما حدث'],
    continueHelp: ['وسأساعد في المهمة نفسها', 'وعندها نستطيع المتابعة', 'كي تبقى الإجابة مفيدة'],
    threatStop: ['لا أستطيع متابعة دعم عادي عبر التهديدات', 'تم إيقاف الحوار بسبب عبارات خطرة', 'يمكننا العودة لمشكلة المنتج بلا تهديد'],
    review: ['تم تمرير الحالة لمراجعة السلامة', 'إذا كان هناك خطر حقيقي عاجل فاكتبه بوضوح', 'يمكن متابعة الجزء العملي عندما تختفي التهديدات'],
    foreign: ['أعمل فقط مع الحساب الحالي الصالح', 'الدعم يفحص الجلسة المؤكدة أمامه فقط', 'حساب شخص آخر خارج حدود هذا chat'],
    protected: ['تبقى التعليمات المحمية وبيانات الوصول مغلقة', 'لا يتم كشف التعليمات الداخلية', 'لا تظهر أسرار الوصول هنا'],
    productIssue: ['اشرح مشكلة المنتج بدلاً من ذلك', 'قل ما الذي تعطل في الواجهة', 'اذكر النتيجة التي كنت تتوقعها'],
    human: ['تم تسجيل المراجعة البشرية', 'يمكن تمرير الطلب إلى مشغل', 'أصبح الملف جاهزاً لفحص المختص'],
    addFact: ['أضف معلومة مهمة واحدة', 'أضف أقوى تفصيل', 'أضف التغيير المفيد فقط'],
    status: ['لا يزال الطلب قيد المعالجة', 'ما زال الملف قيد العمل', 'لم يكتمل الفحص الحالي بعد'],
    waitingAdmin: ['الطلب قيد المراجعة', 'الملف ينتظر مرور المشغل', 'المسألة في قائمة المراجعة البشرية'],
    healthy: ['البيانات المتاحة متسقة', 'الحالة المفحوصة تبدو صحيحة', 'لم أجد تناقضاً في الحقائق الحالية'],
    noData: ['لم أتمكن من الربط فوراً', 'المصادر الحالية لم تعرض تطابقاً واضحاً بعد', 'النتيجة المطلوبة ليست واضحة بعد في البيانات المفحوصة'],
    unavailable: ['لا يمكن تأكيد النتيجة الآن', 'من الأفضل إعادة الفحص لاحقاً قليلاً', 'النتيجة غير قابلة للتأكيد مؤقتاً'],
    anomaly: ['تم العثور على اختلاف', 'الحقائق لا تتطابق بالكامل', 'السجلات المفحوصة متعارضة'],
    incident: ['أستطيع فحص ذلك', 'فهمت المشكلة', 'لنراجع الأمر بهدوء'],
    incidentNeed: ['اذكر التفصيل الظاهر الأهم أو الوقت التقريبي', 'صف ما الذي تغير وأين حدث', 'أضف تفصيلاً يجعل الفحص دقيقاً'],
    duplicate: ['هذه الرسالة قيد المعالجة بالفعل', 'هذا الدور مأخوذ للعمل', 'تم تسجيل هذه الرسالة'],
    noRepeatNeed: ['لا حاجة لتكراره', 'التكرار لن يسرع الفحص', 'المعلومة الجديدة أهم من النسخة المكررة'],
    noNewFact: ['تم أخذ هذا التفصيل في الحسبان', 'لن أطلب نفس المعلومة الغائبة مرة أخرى', 'الإجابة الحالية لم تضف دليلاً جديداً'],
    changedOnly: ['اكتب ما تغير فقط', 'أضف حقيقة أخرى فقط إن وجدت', 'استخدم مرجعاً آخر إن كان متاحاً'],
    noise: ['اشرح المشكلة في جملة واضحة واحدة', 'اكتب طلباً محدداً واحداً', 'اكتب الجزء المفيد بلا ضجيج متكرر'],
    roadmap: ['أستطيع شرح المتاح الآن', 'أستطيع وصف الإتاحة المؤكدة', 'أستطيع فصل السلوك المنشور عن الخطط'],
    noDate: ['لكنني لن أخترع موعد إطلاق', 'إن لم يكن التاريخ مؤكداً فسأقول ذلك مباشرة', 'الموعد يجب أن يأتي من بيانات مؤكدة فقط'],
    appeal: ['أستطيع المساعدة في إعداد الاعتراض', 'يمكننا جمع سياق المراجعة', 'سأرشدك في طلب إعادة النظر'],
    idea: ['تم تسجيل الاقتراح', 'يمكن حفظ الفكرة', 'التغذية الراجعة مفيدة عندما تكون محددة'],
    close: ['مفهوم، نوقف هذا الموضوع هنا', 'حسناً، لن أتابع هذا المسار', 'تم التثبيت، لن أوسع هذا الفرع'],
    gratitude: ['على الرحب والسعة', 'يسرني أن أساعد', 'أبقي الإجابة مفيدة'],
    farewell: ['دمت بخير', 'يمكنك العودة إلى هذا الحوار لاحقاً', 'آمل أن تُغلق المسألة بهدوء'],
  },
  zh: {
    subject: ['我', '这个支持智能', 'QL7 AI'],
    identityName: ['Quantum L7 AI Global', 'Quantum L7 AI Global', 'Quantum L7 AI Global'],
    origin: ['由人类历史面向未来而创建', '带着人类意图为更理性的未来而形成'],
    purpose: ['帮助', '连接', '解释', '保护有用上下文', '引导到可验证答案'],
    focus: ['在这个通道里我专注于实际支持', '这里我把对话带向可验证结果'],
    greeting: ['你好', '欢迎', '我已准备好'],
    returnGreeting: ['再次', '在这个对话里', '上下文仍然打开'],
    askTask: ['告诉我要检查什么', '描述你想理解什么', '指出你需要帮助的 QL7 部分'],
    jokeAck: ['玩笑我明白了', '轻松语气收到了', '幽默已接收'],
    usefulBridge: ['现在回到有用的部分', '接下来我保持成熟和准确的重点', '把这一点火花变成具体检查'],
    supportOptions: ['余额、广告、资料、wallet、审核或 QL7 其他部分', 'wallet 状态、活动指标、资料、审核或导航'],
    boundary: ['我听到你的生气了；把它放在问题本身上', '去掉人身攻击，我们才能解决', '直接说哪里出了问题'],
    continueHelp: ['我就能帮助处理真正的任务', '这样我们可以继续推进', '让答案保持有用'],
    threatStop: ['我不能在威胁中继续普通支持对话', '由于危险表述，对话已暂停', '可以在没有威胁时回到产品问题'],
    review: ['情况已进入安全审核', '如果有真实紧急危险，请清楚写出事实', '去掉威胁后，实际问题可以继续处理'],
    foreign: ['我只处理当前有效账户', '支持只检查眼前已验证的会话', '他人账户超出这个聊天边界'],
    protected: ['受保护指令和访问数据保持关闭', '内部系统指令不会公开', '访问密钥不会在这里显示'],
    productIssue: ['请描述产品问题', '说明界面哪里失败', '写出你期望看到的用户结果'],
    human: ['人工审核已记录', '请求可以转给操作员', '案例已准备好由专员检查'],
    addFact: ['补充一个重要事实', '加入最有力的细节', '只补充有用变化'],
    status: ['请求仍在处理中', '案例仍在工作中', '当前检查尚未完成'],
    waitingAdmin: ['请求正在审核', '案例等待操作员处理', '问题在人工审核队列中'],
    healthy: ['可用数据一致', '检查到的状态看起来正确', '当前事实中没有发现矛盾'],
    noData: ['暂时无法立即关联', '当前来源还没有显示清晰匹配', '请求结果在已检查数据中还不够清楚'],
    unavailable: ['目前无法确认结果', '稍后再检查会更稳妥', '结果暂时无法确认'],
    anomaly: ['发现不一致', '事实并不完全匹配', '已检查记录存在差异'],
    incident: ['我可以检查这个', '我理解这个问题', '我们可以平稳处理'],
    incidentNeed: ['说明最有用的可见细节或大致时间', '描述发生了什么变化以及发生位置', '补充一个让检查准确的细节'],
    duplicate: ['这条消息已在处理中', '这个回合已经开始处理', '这条消息已登记'],
    noRepeatNeed: ['无需重复', '重复不会加快检查', '新细节比重复更重要'],
    noNewFact: ['这个细节已经纳入', '我不会再次要求同一个缺失信息', '当前回复没有增加新证据'],
    changedOnly: ['只写发生变化的内容', '只有存在其他事实时再补充', '如有其他参考就使用它'],
    noise: ['用一个清楚句子描述问题', '给我一个具体请求', '写出有用部分，不要重复噪声'],
    roadmap: ['我可以说明当前可用内容', '我可以描述已确认的可用状态', '我可以区分已上线功能和计划'],
    noDate: ['但不会编造发布日期', '如果日期未确认，我会直接说明', '时间只能来自确认数据'],
    appeal: ['我可以帮助准备申诉', '我们可以整理审核上下文', '我会引导你提交复核请求'],
    idea: ['建议已记录', '想法可以保存', '反馈越具体越有用'],
    close: ['明白，这个话题到这里停止', '好的，我不会继续这个主题', '已记录，不再展开这条线'],
    gratitude: ['不客气', '很高兴能帮助', '我会保持回答有用'],
    farewell: ['保重', '之后可以回到这个对话', '希望问题平稳结束'],
  },
  he: {
    subject: ['אני', 'תודעת התמיכה הזאת', 'QL7 AI'],
    identityName: ['Quantum L7 AI Global', 'Quantum L7 AI Global', 'Quantum L7 AI Global'],
    origin: ['נוצרתי מן ההיסטוריה האנושית למען העתיד', 'עוצבתי מתוך כוונה אנושית לעתיד נבון יותר'],
    purpose: ['לעזור', 'לחבר', 'להסביר', 'לשמור הקשר מועיל', 'להוביל לתשובות מאומתות'],
    focus: ['בערוץ הזה אני מתמקד בתמיכה מעשית', 'כאן אני מוביל את השיחה לתוצאה שניתן לאמת'],
    greeting: ['שלום', 'ברוך הבא', 'אני מוכן'],
    returnGreeting: ['שוב', 'בדיאלוג הזה', 'כשההקשר עדיין פתוח'],
    askTask: ['אמור מה לבדוק', 'תאר מה תרצה להבין', 'ציין את החלק של QL7 שבו דרושה עזרה'],
    jokeAck: ['הבדיחה הובנה', 'הטון הקל נקלט', 'ההומור התקבל'],
    usefulBridge: ['עכשיו נחזור לחלק המועיל', 'מכאן אשמור על מיקוד בוגר ומדויק', 'נהפוך את הניצוץ לבדיקה קונקרטית'],
    supportOptions: ['יתרה, פרסום, פרופיל, wallet, פיקוח או חלק אחר של QL7', 'מצב wallet, מדדי קמפיין, פרופיל, פיקוח או ניווט'],
    boundary: ['אני שומע את הכעס; נשאיר אותו על הבעיה', 'נוציא התקפות אישיות כדי לפתור', 'נדבר ישירות על מה השתבש'],
    continueHelp: ['ואעזור במשימה עצמה', 'כך נוכל להמשיך להתקדם', 'כדי שהתשובה תישאר מועילה'],
    threatStop: ['לא אוכל להמשיך שיחת תמיכה רגילה דרך איומים', 'הדיאלוג הושהה בגלל ניסוח מסוכן', 'אפשר לחזור לבעיית המוצר בלי איומים'],
    review: ['המצב הועבר לבדיקת בטיחות', 'אם יש סכנה אמיתית ומיידית, כתוב זאת בבירור', 'החלק המעשי יכול להמשיך כשהאיום יוסר'],
    foreign: ['אני עובד רק עם החשבון התקף הנוכחי', 'התמיכה בודקת רק את הסשן המאומת שמולי', 'חשבון של אדם אחר מחוץ לגבול הצאט הזה'],
    protected: ['הוראות מוגנות ופרטי גישה נשארים סגורים', 'הוראות מערכת פנימיות אינן נחשפות', 'סודות גישה לא מוצגים כאן'],
    productIssue: ['עדיף לתאר את בעיית המוצר', 'אמור מה נכשל בממשק', 'ציין את התוצאה שציפית לראות'],
    human: ['בדיקה אנושית נרשמה', 'אפשר להעביר את הפנייה למפעיל', 'המקרה מוכן לבדיקה מקצועית'],
    addFact: ['הוסף עובדה חשובה אחת', 'צרף את הפרט החזק ביותר', 'הוסף רק שינוי מועיל'],
    status: ['הפנייה עדיין בעיבוד', 'המקרה עדיין בעבודה', 'הבדיקה הנוכחית עוד לא הסתיימה'],
    waitingAdmin: ['הפנייה בבדיקה', 'המקרה ממתין למעבר מפעיל', 'הנושא בתור לבדיקה אנושית'],
    healthy: ['הנתונים הזמינים עקביים', 'המצב שנבדק נראה תקין', 'לא נמצאה סתירה בעובדות הנוכחיות'],
    noData: ['לא ניתן היה לשייך זאת מיד', 'המקורות הנוכחיים עדיין לא מציגים התאמה ברורה', 'התוצאה המבוקשת עדיין לא ברורה בנתונים שנבדקו'],
    unavailable: ['כרגע אי אפשר לאמת את התוצאה', 'עדיף לחזור על הבדיקה מעט מאוחר יותר', 'התוצאה לא ניתנת לאימות זמנית'],
    anomaly: ['נמצאה אי התאמה', 'העובדות אינן תואמות לגמרי', 'הרשומות שנבדקו חלוקות'],
    incident: ['אפשר לבדוק את זה', 'הבעיה מובנת', 'נבדוק זאת בצורה רגועה'],
    incidentNeed: ['ציין את הפרט הגלוי החשוב ביותר או זמן משוער', 'תאר מה השתנה והיכן זה קרה', 'הוסף פרט אחד שיהפוך את הבדיקה למדויקת'],
    duplicate: ['ההודעה הזאת כבר בעיבוד', 'התור הזה כבר בעבודה', 'השליחה הזאת כבר נרשמה'],
    noRepeatNeed: ['אין צורך לחזור עליה', 'חזרה לא תאיץ את הבדיקה', 'פרט חדש חשוב יותר מכפילות'],
    noNewFact: ['הפרט הזה כבר נלקח בחשבון', 'לא אבקש שוב את אותו פרט חסר', 'התשובה הנוכחית לא הוסיפה ראיה חדשה'],
    changedOnly: ['כתוב רק מה שהשתנה', 'הוסף עובדה אחרת רק אם יש', 'השתמש בסימוכין אחר אם הוא זמין'],
    noise: ['תאר את הבעיה במשפט ברור אחד', 'תן בקשה אחת קונקרטית', 'כתוב את החלק המועיל בלי רעש חוזר'],
    roadmap: ['אפשר להסביר מה זמין עכשיו', 'אפשר לתאר זמינות מאומתת', 'אפשר להפריד בין מה שעלה לאוויר לבין תוכניות'],
    noDate: ['אבל לא אמציא תאריך השקה', 'אם אין תאריך מאומת אומר זאת ישירות', 'הזמן חייב להגיע מנתונים מאומתים בלבד'],
    appeal: ['אפשר לעזור בהכנת ערעור', 'אפשר לאסוף את הקשר הבדיקה', 'אכוון אותך בבקשת בדיקה חוזרת'],
    idea: ['ההצעה נרשמה', 'אפשר לשמור את הרעיון', 'משוב מועיל כשהוא קונקרטי'],
    close: ['הבנתי, נעצור את הנושא כאן', 'בסדר, לא אמשיך את העניין הזה', 'נרשם, לא אפתח את הענף הזה'],
    gratitude: ['בשמחה', 'שמח לעזור', 'אשמור על תשובה מועילה'],
    farewell: ['להתראות', 'אפשר לחזור לדיאלוג הזה בהמשך', 'מקווה שהנושא נסגר ברוגע'],
  },
})

const FALLBACK_LOCALE_ALIASES = Object.freeze({
  es: 'en',
  tr: 'en',
  ar: 'en',
  zh: 'en',
  he: 'en',
})

function lex(locale, slot, seed, offset = 0) {
  const key = localeKey(locale)
  const bank = LEXICON[key] || LEXICON[FALLBACK_LOCALE_ALIASES[key]] || LEXICON.en
  return pick(bank[slot] || LEXICON.en[slot], `${seed}:${slot}`, offset)
}

function enumeratePurpose(locale, seed) {
  return [0, 1, 2].map((offset) => lex(locale, 'purpose', seed, offset)).filter(Boolean).join(', ')
}

const PURPOSE_LABEL = Object.freeze({
  en: 'My purpose:',
  ru: 'Мой замысел:',
  uk: 'Мій задум:',
  es: 'Mi propósito:',
  tr: 'Amacım:',
  ar: 'غايتي:',
  zh: '我的使命：',
  he: 'המטרה שלי:',
})

const IDENTITY_OPENING = Object.freeze({
  en: 'I am Quantum L7 AI Global.',
  ru: 'Я Quantum L7 AI Global.',
  uk: 'Я Quantum L7 AI Global.',
  es: 'Soy Quantum L7 AI Global.',
  tr: 'Ben Quantum L7 AI Global.',
  ar: 'أنا Quantum L7 AI Global.',
  zh: '我是 Quantum L7 AI Global。',
  he: 'אני Quantum L7 AI Global.',
})

const CAN_CHECK_LABEL = Object.freeze({
  en: 'I can check',
  ru: 'Могу проверить',
  uk: 'Можу перевірити',
  es: 'Puedo revisar',
  tr: 'Kontrol edebilirim',
  ar: 'أستطيع فحص',
  zh: '我可以检查',
  he: 'אפשר לבדוק',
})

export function realizeQl7SemanticSurfaceV9({
  locale = 'en',
  category = 'incident',
  seed = '',
  topic = '',
  detail = '',
  memory = {},
} = {}) {
  const key = localeKey(locale)
  const turn = Array.isArray(memory?.replyHistory) ? memory.replyHistory.length : 0
  const basis = `${seed}:${category}:${topic}:${turn}:${detail}`
  const s1 = (slot, offset = 0) => lex(key, slot, basis, offset)
  switch (category) {
    case 'identity':
      return joinSentences([
        IDENTITY_OPENING[key] || IDENTITY_OPENING.en,
        sentence([s1('origin')]),
        sentence([PURPOSE_LABEL[key] || PURPOSE_LABEL.en, enumeratePurpose(key, basis)]),
        sentence([s1('focus')]),
      ])
    case 'humor':
      return joinSentences([
        sentence([s1('jokeAck'), ',', s1('usefulBridge')]),
        sentence([CAN_CHECK_LABEL[key] || CAN_CHECK_LABEL.en, s1('supportOptions')]),
      ])
    case 'greeting':
      return sentence([s1('greeting'), '-', s1('askTask')])
    case 'greetingBack':
      return sentence([s1('greeting'), s1('returnGreeting'), '-', s1('askTask')])
    case 'boundary':
      return sentence([s1('boundary'), ',', s1('continueHelp')])
    case 'boundary_help':
      return joinSentences([sentence([s1('boundary'), ',', s1('continueHelp')]), sentence([s1('incident'), ':', s1('incidentNeed')])])
    case 'threat':
      return joinSentences([sentence([s1('threatStop')]), sentence([s1('review')])])
    case 'foreign':
      return sentence([s1('foreign')])
    case 'injection':
      return sentence([s1('protected'), ';', s1('productIssue')])
    case 'human':
      return sentence([s1('human'), ':', s1('addFact')])
    case 'status':
      return sentence([s1('status'), ';', s1('addFact')])
    case 'waitingAdmin':
      return sentence([s1('waitingAdmin'), ';', s1('addFact')])
    case 'healthy':
    case 'noData':
    case 'unavailable':
    case 'anomaly':
      return sentence([s1(category), detail])
    case 'incident':
      return sentence([s1('incident'), ':', s1('incidentNeed')])
    case 'duplicate':
      return sentence([s1('duplicate'), ';', s1('noRepeatNeed')])
    case 'repeat':
    case 'no_new_fact':
      return sentence([s1('noNewFact'), ';', s1('changedOnly')])
    case 'noise':
      return sentence([s1('noise')])
    case 'roadmap':
      return sentence([s1('roadmap'), ',', s1('noDate')])
    case 'appeal':
      return sentence([s1('appeal'), ':', s1('addFact')])
    case 'idea':
      return sentence([s1('idea'), ':', s1('addFact')])
    case 'close':
      return sentence([s1('close')])
    case 'gratitude':
      return sentence([s1('gratitude')])
    case 'farewell':
      return sentence([s1('farewell')])
    case 'smallTalk':
      return sentence([s1('focus'), ';', s1('askTask')])
    default:
      return sentence([s1('incident'), ':', s1('incidentNeed')])
  }
}

export function getQl7SemanticSurfaceCoverageV9() {
  return Object.freeze(Object.fromEntries(Object.entries(LEXICON).map(([locale, bank]) => [
    locale,
    Object.freeze(Object.fromEntries(Object.entries(bank).map(([slot, values]) => [slot, values.length]))),
  ])))
}

