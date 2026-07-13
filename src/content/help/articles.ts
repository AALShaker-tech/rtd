import type { HelpArticle } from "./types";

/**
 * The RTD staff usage guide — one shared, role-filtered source of truth.
 *
 * Everything here is verified against the actual code (statuses from
 * `REQUEST_STATUSES`, roles from `UserRole`, pricing from the request service /
 * pricing actions, the reference format from `buildReferenceNumber`). Where a
 * behaviour is deliberately loose in the product (e.g. statuses are not
 * transition-guarded) or a surface is still evolving, the copy says so rather
 * than inventing a rule. Arabic is professional/formal (internal staff docs),
 * not the customer-facing Najdi voice used on the marketing site.
 */
export const HELP_ARTICLES: HelpArticle[] = [
  // ─────────────────────────── Shared: Getting started ───────────────────────────
  {
    slug: "getting-started",
    order: 10,
    roles: ["admin", "employee", "driver"],
    title: { en: "Getting started", ar: "البداية" },
    summary: {
      en: "The three staff roles, signing in, and how to read a request reference number.",
      ar: "الأدوار الثلاثة للطاقم، وتسجيل الدخول، وكيفية قراءة الرقم المرجعي للطلب.",
    },
    body: [
      {
        kind: "paragraph",
        text: {
          en: "RTD is operated by three kinds of staff account, each with its own dashboard. You are signed in to the dashboard that matches your role.",
          ar: "تُدار منصة RTD عبر ثلاثة أنواع من حسابات الطاقم، لكل نوع لوحة تحكّم خاصة به. أنت مُسجَّل الدخول في اللوحة التي تناسب دورك.",
        },
      },
      {
        kind: "heading",
        text: { en: "The three roles", ar: "الأدوار الثلاثة" },
      },
      {
        kind: "bullets",
        items: [
          {
            en: "Admin (Admin Console) — full access: requests, pricing, cities, staff, and settings. A Superadmin is an admin who can additionally manage other admin accounts and permanently delete requests.",
            ar: "المسؤول (لوحة الإدارة) — صلاحية كاملة: الطلبات والأسعار والمدن والطاقم والإعدادات. المسؤول الأعلى (Superadmin) هو مسؤول تُضاف إليه إدارة حسابات المسؤولين الآخرين وحذف الطلبات نهائيًا.",
          },
          {
            en: "Operations employee (Operations Console) — works the requests assigned to them: contacting the client, adding notes, escalating, and sharing the WhatsApp summary.",
            ar: "موظف العمليات (لوحة العمليات) — يعمل على الطلبات المُسندة إليه: التواصل مع العميل، وإضافة الملاحظات، والتصعيد، ومشاركة ملخّص واتساب.",
          },
          {
            en: "Driver (Driver App) — sees the trips assigned to them and updates each task's status as they carry it out.",
            ar: "السائق (تطبيق السائق) — يرى الرحلات المُسندة إليه ويحدّث حالة كل مهمة أثناء تنفيذها.",
          },
        ],
      },
      {
        kind: "heading",
        text: { en: "Signing in", ar: "تسجيل الدخول" },
      },
      {
        kind: "steps",
        items: [
          {
            en: "Open your dashboard's login page (Admin, Operations, or Driver) and enter your email and password.",
            ar: "افتح صفحة تسجيل الدخول الخاصة بلوحتك (الإدارة أو العمليات أو السائق) وأدخل بريدك الإلكتروني وكلمة المرور.",
          },
          {
            en: "New accounts are created “pending activation”. The first time, use the one-time setup link emailed to you to choose your own password.",
            ar: "تُنشأ الحسابات الجديدة بحالة “بانتظار التفعيل”. في المرة الأولى، استخدم رابط التفعيل لمرة واحدة المُرسَل إلى بريدك لاختيار كلمة المرور الخاصة بك.",
          },
          {
            en: "If your setup link expired, request a new one from the login page, or ask an admin to resend it.",
            ar: "إذا انتهت صلاحية رابط التفعيل، فاطلب رابطًا جديدًا من صفحة تسجيل الدخول، أو اطلب من أحد المسؤولين إعادة إرساله.",
          },
        ],
      },
      {
        kind: "heading",
        text: { en: "Reading a reference number", ar: "قراءة الرقم المرجعي" },
      },
      {
        kind: "paragraph",
        text: {
          en: "Every request has a unique reference in the format RTD-YYYY-NNNNN — the letters “RTD”, the year it was created, then a five-digit sequence. For example, RTD-2026-00045 is the 45th request of 2026. Use this reference in every conversation about a request; the customer sees the same code on their confirmation.",
          ar: "لكل طلب رقم مرجعي فريد بالصيغة RTD-YYYY-NNNNN — الأحرف “RTD”، ثم سنة إنشائه، ثم تسلسل من خمسة أرقام. مثال: RTD-2026-00045 هو الطلب رقم 45 لعام 2026. استخدم هذا الرقم في كل مراسلة حول الطلب؛ فالعميل يرى الرمز نفسه في تأكيده.",
        },
      },
      {
        kind: "callout",
        tone: "tip",
        text: {
          en: "The language toggle at the top switches the whole app between English and Arabic (and left-to-right / right-to-left). This guide follows it automatically.",
          ar: "زر تبديل اللغة في الأعلى ينقل التطبيق بالكامل بين الإنجليزية والعربية (ومن اليسار لليمين / من اليمين لليسار). ويتبع هذا الدليل ذلك تلقائيًا.",
        },
      },
    ],
  },

  // ─────────────────────────── Driver ───────────────────────────
  {
    slug: "driver-tasks",
    order: 12,
    roles: ["driver"],
    title: { en: "Your tasks (drivers)", ar: "مهامك (السائقون)" },
    summary: {
      en: "See the trips assigned to you, read the trip details, and update each task's status.",
      ar: "اطّلع على الرحلات المُسندة إليك، واقرأ تفاصيل الرحلة، وحدّث حالة كل مهمة.",
    },
    body: [
      {
        kind: "paragraph",
        text: {
          en: "Your app shows the trips (tasks) an admin has assigned to you. Each task is one leg of a customer's journey — for example a home-to-airport transfer or a chauffeur day.",
          ar: "يعرض تطبيقك الرحلات (المهام) التي أسندها إليك أحد المسؤولين. كل مهمة هي مرحلة واحدة من رحلة العميل — مثل توصيل من المنزل إلى المطار أو يوم مع سائق خاص.",
        },
      },
      {
        kind: "heading",
        text: { en: "What each task card shows", ar: "ما يعرضه كل بطاقة مهمة" },
      },
      {
        kind: "bullets",
        items: [
          { en: "The request reference and the current task status.", ar: "الرقم المرجعي للطلب وحالة المهمة الحالية." },
          { en: "The service, city, and scheduled date and time.", ar: "الخدمة والمدينة والتاريخ والوقت المحدّدين." },
          { en: "Pickup and drop-off (or home address / hotel), and the flight number when relevant.", ar: "نقطة الاستلام والتسليم (أو عنوان المنزل / الفندق)، ورقم الرحلة عند الحاجة." },
          { en: "The car class, any additional vehicles, and the number of passengers.", ar: "فئة السيارة، وأي مركبات إضافية، وعدد الركاب." },
          { en: "The customer's name and a tappable phone number to call them.", ar: "اسم العميل ورقم هاتف قابل للضغط للاتصال به." },
        ],
      },
      {
        kind: "heading",
        text: { en: "Updating a task's status", ar: "تحديث حالة المهمة" },
      },
      {
        kind: "paragraph",
        text: {
          en: "A task moves forward one step at a time, in this fixed order:",
          ar: "تتقدّم المهمة خطوة واحدة في كل مرة، وفق هذا الترتيب الثابت:",
        },
      },
      {
        kind: "steps",
        items: [
          { en: "Pending — the task is assigned to you and awaiting your acceptance.", ar: "بانتظار القبول — المهمة مُسندة إليك وتنتظر قبولك." },
          { en: "Accepted — you have accepted the task.", ar: "تم القبول — قبلت المهمة." },
          { en: "On the way — you are en route to the pickup.", ar: "في الطريق — أنت في طريقك إلى نقطة الاستلام." },
          { en: "Arrived — you have reached the pickup point.", ar: "وصل — وصلت إلى نقطة الاستلام." },
          { en: "Completed — the trip is finished.", ar: "مكتمل — انتهت الرحلة." },
        ],
      },
      {
        kind: "paragraph",
        text: {
          en: "Tap the gold button to advance to the next status. Once a task is Completed there is no further step. Moving a task to “On the way” or “Arrived” automatically marks the whole request as In Progress for the operations team.",
          ar: "اضغط الزر الذهبي للانتقال إلى الحالة التالية. وبمجرد اكتمال المهمة لا توجد خطوة بعدها. ونقل المهمة إلى “في الطريق” أو “وصل” يجعل الطلب بأكمله “قيد التنفيذ” تلقائيًا لدى فريق العمليات.",
        },
      },
      {
        kind: "callout",
        tone: "info",
        text: {
          en: "You can only update tasks assigned to you. Add anything the office should know in the Driver notes box and press Save — you can save notes at any status.",
          ar: "يمكنك تحديث المهام المُسندة إليك فقط. أضف أي ملاحظة ينبغي أن يعرفها المكتب في خانة ملاحظات السائق ثم اضغط حفظ — ويمكنك حفظ الملاحظات في أي حالة.",
        },
      },
      {
        kind: "link",
        href: "/driver",
        label: { en: "Open my tasks", ar: "فتح مهامي" },
      },
    ],
  },

  // ─────────────────────────── Employee / Operations ───────────────────────────
  {
    slug: "employee-working-requests",
    order: 15,
    roles: ["employee"],
    title: { en: "Working your requests (operations)", ar: "العمل على طلباتك (العمليات)" },
    summary: {
      en: "Your assigned list, contacting the client, notes, escalation, and what only an admin can do.",
      ar: "قائمة الطلبات المُسندة إليك، والتواصل مع العميل، والملاحظات، والتصعيد، وما ينفرد به المسؤول.",
    },
    body: [
      {
        kind: "paragraph",
        text: {
          en: "Your console lists the requests assigned to you. Open one to see the customer details and the full journey, and to take the actions below.",
          ar: "تعرض لوحتك الطلبات المُسندة إليك. افتح أحدها لعرض بيانات العميل والرحلة كاملة، ولتنفيذ الإجراءات أدناه.",
        },
      },
      {
        kind: "heading",
        text: { en: "Contacting the client", ar: "التواصل مع العميل" },
      },
      {
        kind: "bullets",
        items: [
          { en: "Call the customer directly with the phone button.", ar: "اتّصل بالعميل مباشرةً عبر زر الهاتف." },
          { en: "Open WhatsApp to the RTD business line, or copy a ready-made WhatsApp summary of the whole request to paste into a chat.", ar: "افتح واتساب على خط RTD التجاري، أو انسخ ملخّص واتساب جاهزًا للطلب بالكامل للصقه في المحادثة." },
        ],
      },
      {
        kind: "heading",
        text: { en: "Updating the request", ar: "تحديث الطلب" },
      },
      {
        kind: "steps",
        items: [
          { en: "Once you have reached the customer, press “Mark client contacted”. This sets the request status to Client Contacted. (You can only do this for requests assigned to you.)", ar: "بعد أن تتواصل مع العميل، اضغط “تم التواصل مع العميل”. يضبط ذلك حالة الطلب إلى “تم التواصل مع العميل”. (يمكنك فعل ذلك للطلبات المُسندة إليك فقط.)" },
          { en: "Record anything useful in Internal notes — these stay inside the team.", ar: "سجّل أي معلومة مفيدة في الملاحظات الداخلية — وتبقى داخل الفريق." },
          { en: "If a request needs an admin's attention (pricing, assignment, a problem), use Escalate to admin with a short note.", ar: "إذا احتاج الطلب إلى تدخّل مسؤول (تسعير، إسناد، مشكلة)، فاستخدم “تصعيد للإدارة” مع ملاحظة موجزة." },
        ],
      },
      {
        kind: "heading",
        text: { en: "What operations cannot do", ar: "ما لا يستطيع فريق العمليات فعله" },
      },
      {
        kind: "paragraph",
        text: {
          en: "These are reserved for admins: assigning an employee or driver, changing the price or confirming a final price, setting payment status, freely changing the status (beyond “mark contacted”), and cancelling or deleting a request. When you need any of these, escalate to an admin.",
          ar: "هذه الإجراءات محصورة بالمسؤولين: إسناد موظف أو سائق، وتغيير السعر أو تأكيد السعر النهائي، وضبط حالة الدفع، وتغيير الحالة بحرّية (بخلاف “تم التواصل”)، وإلغاء الطلب أو حذفه. وعند الحاجة إلى أيٍّ منها، صعّد الأمر إلى مسؤول.",
        },
      },
      {
        kind: "callout",
        tone: "info",
        text: {
          en: "To understand what each request status means, see the “Request statuses” topic.",
          ar: "لفهم معنى كل حالة من حالات الطلب، راجع موضوع “حالات الطلب”.",
        },
      },
      {
        kind: "link",
        href: "/employee",
        label: { en: "Open my assigned requests", ar: "فتح الطلبات المُسندة إليّ" },
      },
    ],
  },

  // ─────────────────────────── Admin: Overview ───────────────────────────
  {
    slug: "reading-the-overview",
    order: 20,
    roles: ["admin"],
    title: { en: "Reading the overview dashboard", ar: "قراءة لوحة النظرة العامة" },
    summary: {
      en: "What the overview stat cards and breakdowns tell you at a glance.",
      ar: "ما تخبرك به بطاقات الإحصائيات والتصنيفات في لوحة النظرة العامة بنظرة سريعة.",
    },
    body: [
      {
        kind: "paragraph",
        text: {
          en: "The Overview is the admin home screen. It summarises the whole operation so you can spot what needs attention today.",
          ar: "“نظرة عامة” هي الصفحة الرئيسية للمسؤول. تلخّص العمليات بأكملها لتلاحظ ما يحتاج إلى انتباه اليوم.",
        },
      },
      {
        kind: "bullets",
        items: [
          { en: "Total requests, new requests, confirmed, completed, and cancelled — the volume at each stage.", ar: "إجمالي الطلبات، والطلبات الجديدة، والمؤكدة، والمكتملة، والملغاة — حجم العمل في كل مرحلة." },
          { en: "Unassigned — requests with no operations employee yet; these usually need action first.", ar: "غير مُسندة — طلبات بلا موظف عمليات بعد؛ وغالبًا ما تحتاج إلى إجراء أولًا." },
          { en: "Pending verification — requests where the customer's phone or email is not yet verified.", ar: "بانتظار التأكيد — طلبات لم يُؤكَّد فيها هاتف العميل أو بريده بعد." },
          { en: "Upcoming today — services scheduled for today.", ar: "خدمات اليوم — الخدمات المجدوَلة لليوم." },
          { en: "Breakdowns by city, by service, and by car category — where demand is concentrated.", ar: "تصنيفات حسب المدينة والخدمة وفئة السيارة — أين يتركّز الطلب." },
        ],
      },
      {
        kind: "link",
        href: "/admin",
        label: { en: "Open the overview", ar: "فتح النظرة العامة" },
      },
    ],
  },

  // ─────────────────────────── Admin + Employee: Statuses ───────────────────────────
  {
    slug: "request-statuses",
    order: 30,
    roles: ["admin", "employee"],
    title: { en: "Request statuses", ar: "حالات الطلب" },
    summary: {
      en: "The nine statuses in business order and what moves a request between them.",
      ar: "الحالات التسع بالترتيب التشغيلي وما ينقل الطلب بينها.",
    },
    body: [
      {
        kind: "paragraph",
        text: {
          en: "Every request carries one status. The list below is the intended business order, but statuses are not locked to a strict sequence — an admin can set any status when the situation calls for it. Several statuses are also set automatically by other actions.",
          ar: "يحمل كل طلب حالة واحدة. والقائمة أدناه هي الترتيب التشغيلي المقصود، لكن الحالات ليست مقيّدة بتسلسل صارم — إذ يمكن للمسؤول ضبط أي حالة عندما يستدعي الموقف ذلك. كما تُضبط عدة حالات تلقائيًا نتيجة إجراءات أخرى.",
        },
      },
      {
        kind: "steps",
        items: [
          { en: "Request Received — the customer just submitted the request (the starting status).", ar: "تم استلام الطلب — أرسل العميل الطلب للتو (حالة البداية)." },
          { en: "Under Review — the team is reviewing the details.", ar: "تحت المراجعة — يراجع الفريق التفاصيل." },
          { en: "Client Contacted — set automatically when operations presses “Mark client contacted”.", ar: "تم التواصل مع العميل — تُضبط تلقائيًا عندما يضغط فريق العمليات “تم التواصل مع العميل”." },
          { en: "Employee Assigned — set automatically when an operations employee is assigned.", ar: "تم تعيين الموظف — تُضبط تلقائيًا عند إسناد موظف عمليات." },
          { en: "Driver Assigned — set automatically when a driver is assigned.", ar: "تم تعيين السائق — تُضبط تلقائيًا عند إسناد سائق." },
          { en: "Confirmed — the request is agreed and booked. The “Mark confirmed” button sets this.", ar: "مؤكد — تمّ الاتفاق على الطلب وحجزه. زر “تأكيد الطلب” يضبط هذه الحالة." },
          { en: "In Progress — the trip is underway; set automatically when a driver marks a task “On the way” or “Arrived”.", ar: "قيد التنفيذ — الرحلة جارية؛ تُضبط تلقائيًا عندما يضع السائق مهمة على “في الطريق” أو “وصل”." },
          { en: "Completed — everything is finished. The “Mark completed” button sets this.", ar: "مكتمل — انتهى كل شيء. زر “إكمال الطلب” يضبط هذه الحالة." },
          { en: "Cancelled — the request is cancelled; set by the Cancel action with a reason.", ar: "ملغي — أُلغي الطلب؛ يُضبط عبر إجراء الإلغاء مع ذكر السبب." },
        ],
      },
      {
        kind: "callout",
        tone: "info",
        text: {
          en: "Every status change is recorded in the request's status history with who changed it and when.",
          ar: "يُسجَّل كل تغيير للحالة في سجلّ حالات الطلب مع بيان مَن غيّرها ومتى.",
        },
      },
    ],
  },

  // ─────────────────────────── Admin: Managing a request (core) ───────────────────────────
  {
    slug: "managing-a-request",
    order: 40,
    roles: ["admin"],
    title: { en: "Managing a request", ar: "إدارة الطلب" },
    summary: {
      en: "The core admin job: open a request, assign staff, confirm the price, set payment, notes, and the WhatsApp summary.",
      ar: "المهمة الأساسية للمسؤول: فتح الطلب، وإسناد الطاقم، وتأكيد السعر، وضبط الدفع، والملاحظات، وملخّص واتساب.",
    },
    body: [
      {
        kind: "paragraph",
        text: {
          en: "Open Requests from the sidebar, then open a reference to reach its detail page. The left side shows the customer, flights, and journey; the right side is the action panel.",
          ar: "افتح “الطلبات” من الشريط الجانبي، ثم افتح رقمًا مرجعيًا للوصول إلى صفحة تفاصيله. يعرض الجانب الأيسر العميل والرحلات والمسار؛ والجانب الأيمن هو لوحة الإجراءات.",
        },
      },
      {
        kind: "image",
        file: "request-detail-actions.png",
        alt: {
          en: "The request detail page action panel: pricing, status, assign, notes.",
          ar: "لوحة الإجراءات في صفحة تفاصيل الطلب: التسعير، الحالة، الإسناد، الملاحظات.",
        },
        caption: {
          en: "The request detail action panel, where most day-to-day work happens.",
          ar: "لوحة الإجراءات في تفاصيل الطلب، حيث يجري معظم العمل اليومي.",
        },
      },
      {
        kind: "heading",
        text: { en: "Assign the team", ar: "إسناد الفريق" },
      },
      {
        kind: "steps",
        items: [
          { en: "Assign an operations employee to own the request — this also sets the status to Employee Assigned.", ar: "أسند موظف عمليات ليتولّى الطلب — ويضبط ذلك الحالة أيضًا إلى “تم تعيين الموظف”." },
          { en: "Assign a driver for the trip — this sets the status to Driver Assigned and links the driver to the request's tasks.", ar: "أسند سائقًا للرحلة — ويضبط ذلك الحالة إلى “تم تعيين السائق” ويربط السائق بمهام الطلب." },
        ],
      },
      {
        kind: "heading",
        text: { en: "Confirm the price", ar: "تأكيد السعر" },
      },
      {
        kind: "paragraph",
        text: {
          en: "Prices start as an estimate. The pricing panel shows the Estimated Total (from the pricing engine) and the Final price. Until the team confirms it, treat the amount as an estimate only, not a committed price.",
          ar: "تبدأ الأسعار كتقدير. تعرض لوحة التسعير الإجمالي التقديري (من محرّك التسعير) والسعر النهائي. وإلى أن يؤكّده الفريق، عامِل المبلغ على أنه تقديري فقط لا سعرًا نهائيًا.",
        },
      },
      {
        kind: "steps",
        items: [
          { en: "To confirm a final price, choose Override, enter the amount, add a short reason, and save. This finalizes the price (price status becomes Finalized).", ar: "لتأكيد سعر نهائي، اختر “تعديل السعر النهائي”، وأدخل المبلغ، وأضف سببًا موجزًا، ثم احفظ. يعتمد ذلك السعر نهائيًا (تصبح حالة السعر “نهائي”)." },
          { en: "To adjust an existing price, use Discount or Surcharge with a reason — these mark the price as Adjusted.", ar: "لتعديل سعر قائم، استخدم “خصم” أو “رسوم إضافية” مع ذكر السبب — ويُوسَم السعر عندها بـ “معدَّل”." },
          { en: "A reason is always required; every change is kept in the price history.", ar: "السبب مطلوب دائمًا؛ ويُحفَظ كل تغيير في سجلّ الأسعار." },
        ],
      },
      {
        kind: "callout",
        tone: "warning",
        text: {
          en: "The estimate is what the customer saw when booking. Confirm the final price with the customer before committing it, and note that final confirmation and availability are verified by the RTD team.",
          ar: "الإجمالي التقديري هو ما رآه العميل عند الحجز. أكّد السعر النهائي مع العميل قبل اعتماده، مع ملاحظة أن التأكيد النهائي والتوفّر يتحقّق منهما فريق RTD.",
        },
      },
      {
        kind: "heading",
        text: { en: "Payment status", ar: "حالة الدفع" },
      },
      {
        kind: "paragraph",
        text: {
          en: "Set the payment status — Unpaid, Partially paid, Paid, or Refunded — to track where a request stands. This is a manual tracking flag the team keeps up to date; online payment collection is not part of the platform yet.",
          ar: "اضبط حالة الدفع — غير مدفوع، أو مدفوع جزئيًا، أو مدفوع، أو مُسترد — لتتبّع موقف الطلب. وهذه إشارة تتبّع يدوية يحدّثها الفريق؛ أمّا تحصيل الدفع الإلكتروني فليس جزءًا من المنصة بعد.",
        },
      },
      {
        kind: "heading",
        text: { en: "Status, notes, and the WhatsApp summary", ar: "الحالة والملاحظات وملخّص واتساب" },
      },
      {
        kind: "bullets",
        items: [
          { en: "Change status from the dropdown, or use the quick “Mark confirmed” and “Mark completed” buttons.", ar: "غيّر الحالة من القائمة المنسدلة، أو استخدم زرّي “تأكيد الطلب” و“إكمال الطلب” السريعين." },
          { en: "Add internal notes to keep a running record for the team.", ar: "أضِف ملاحظات داخلية للاحتفاظ بسجلّ متسلسل للفريق." },
          { en: "Copy the WhatsApp summary — a formatted message with the reference, customer, journey, and total — to send from the RTD business line (+966 55 083 2444).", ar: "انسخ ملخّص واتساب — رسالة منسّقة تتضمّن الرقم المرجعي والعميل والمسار والإجمالي — لإرساله من خطّ RTD التجاري (+966 55 083 2444)." },
          { en: "Export PDF prints the request for records.", ar: "“تصدير PDF” يطبع الطلب للأرشفة." },
        ],
      },
      {
        kind: "heading",
        text: { en: "Cancelling and deleting", ar: "الإلغاء والحذف" },
      },
      {
        kind: "paragraph",
        text: {
          en: "Cancel a request with a reason to set it to Cancelled while keeping its record. Permanent delete removes the request and all its data for good — it is reserved for Superadmins and requires typing the reference number and a second confirmation.",
          ar: "ألغِ الطلب مع ذكر السبب لضبطه على “ملغي” مع الاحتفاظ بسجلّه. أمّا الحذف النهائي فيزيل الطلب وكل بياناته نهائيًا — وهو محصور بالمسؤولين الأعلى (Superadmin) ويتطلّب كتابة الرقم المرجعي وتأكيدًا ثانيًا.",
        },
      },
      {
        kind: "link",
        href: "/admin/requests",
        label: { en: "Open Requests", ar: "فتح الطلبات" },
      },
    ],
  },

  // ─────────────────────────── Admin: Pricing ───────────────────────────
  {
    slug: "pricing",
    order: 50,
    roles: ["admin"],
    title: { en: "Pricing model", ar: "نموذج التسعير" },
    summary: {
      en: "Car classes, per-city trip prices, lounge prices, the city multiplier, and estimate vs. confirmed.",
      ar: "فئات السيارات، وأسعار الرحلات لكل مدينة، وأسعار الصالات، ومعامل المدينة، والفرق بين التقديري والمؤكد.",
    },
    body: [
      {
        kind: "paragraph",
        text: {
          en: "Pricing is deliberately split across a few screens so each value is entered once. Here is how the pieces fit together.",
          ar: "يُوزَّع التسعير عمدًا على عدّة شاشات بحيث تُدخَل كل قيمة مرّة واحدة. وإليك كيف تتكامل الأجزاء.",
        },
      },
      {
        kind: "heading",
        text: { en: "Vehicle (car) classes", ar: "فئات السيارات" },
      },
      {
        kind: "bullets",
        items: [
          { en: "VVIP — the highest tier (e.g. Maybach / Rolls-Royce), up to 3 passengers.", ar: "VVIP — الفئة الأعلى (مثل مايباخ / رولز رويس)، حتى 3 ركاب." },
          { en: "VIP — spacious and recommended for most journeys (e.g. Mercedes V-Class / GMC), up to 6 passengers.", ar: "VIP — واسعة وموصى بها لأغلب الرحلات (مثل مرسيدس V-Class / GMC)، حتى 6 ركاب." },
          { en: "Economy — practical everyday transfers (e.g. Camry / Sonata), up to 4 passengers.", ar: "اقتصادي — تنقّلات يومية عملية (مثل كامري / سوناتا)، حتى 4 ركاب." },
        ],
      },
      {
        kind: "paragraph",
        text: {
          en: "Manage the car classes themselves — their names, capacity, example models, and which is recommended — on the Vehicle Class page. These are the seed defaults; the classes are data-driven, so you can add more.",
          ar: "تُدار فئات السيارات نفسها — أسماؤها وسعتها والطُّرز المثال وأيّها موصى به — من صفحة “فئة السيارة”. وهذه هي القيم الافتراضية الأولية؛ والفئات مبنية على البيانات، فيمكنك إضافة المزيد.",
        },
      },
      {
        kind: "heading",
        text: { en: "Where prices actually live: per city", ar: "أين تُحفظ الأسعار فعليًا: لكل مدينة" },
      },
      {
        kind: "paragraph",
        text: {
          en: "Trip and lounge prices are set per city on the Cities page, not on a single global price list. For transfers, a price is entered once per pricing key and applies to both directions — Home↔Airport, Airport↔Hotel, and Chauffeur during stay — so “to airport” and “from airport” always cost the same within a city.",
          ar: "تُضبط أسعار الرحلات والصالات لكل مدينة من صفحة “المدن”، لا من قائمة أسعار عامّة واحدة. وبالنسبة للتوصيلات، يُدخَل السعر مرّة واحدة لكل مفتاح تسعير ويُطبَّق على الاتجاهين — المنزل↔المطار، والمطار↔الفندق، والسائق الخاص أثناء الإقامة — بحيث يتساوى سعر “إلى المطار” و“من المطار” داخل المدينة نفسها.",
        },
      },
      {
        kind: "bullets",
        items: [
          { en: "Each price is per car class (VVIP / VIP / Economy).", ar: "كل سعر يكون لكل فئة سيارة (VVIP / VIP / اقتصادي)." },
          { en: "Setting a price makes the service available in that city; leaving it blank hides it from customers — the price is the on/off control.", ar: "تحديد سعر يجعل الخدمة متاحة في تلك المدينة؛ وترك الحقل فارغًا يخفيها عن العملاء — فالسعر هو أداة التشغيل/الإيقاف." },
          { en: "The city multiplier scales that city's prices up or down.", ar: "معامل المدينة يرفع أسعار تلك المدينة أو يخفضها." },
        ],
      },
      {
        kind: "heading",
        text: { en: "Lounge / assistance pricing", ar: "تسعير الصالات / المساعدة" },
      },
      {
        kind: "paragraph",
        text: {
          en: "Airport assistance depends on the airport's country: Saudi airports offer Executive Office and Marhaba; airports elsewhere offer Meet & Assist and Fast Track. Define the lounges on the Lounges page, then enable and price each one per airport on the Cities page.",
          ar: "تعتمد مساعدة المطار على دولة المطار: المطارات السعودية تقدّم “المكتب التنفيذي” و“مرحبا”؛ والمطارات خارج المملكة تقدّم “الاستقبال والمساعدة” و“المسار السريع”. عرِّف الصالات من صفحة “الصالات”، ثم فعّل كلًّا منها وحدّد سعرها لكل مطار من صفحة “المدن”.",
        },
      },
      {
        kind: "heading",
        text: { en: "Estimate → confirmed", ar: "من التقديري إلى المؤكد" },
      },
      {
        kind: "paragraph",
        text: {
          en: "When a customer builds a journey, the pricing engine adds up the per-city prices, car class, lounges, and multipliers into an Estimated Total. That estimate stays an estimate until an admin confirms a Final price on the request (see “Managing a request”). Package bookings are the exception — they are created already finalized at the package price.",
          ar: "عندما يصمّم العميل رحلته، يجمع محرّك التسعير أسعار المدينة وفئة السيارة والصالات والمعاملات في “إجمالي تقديري”. ويبقى هذا التقدير تقديريًا إلى أن يؤكّد المسؤول سعرًا نهائيًا على الطلب (راجع “إدارة الطلب”). وتُستثنى حجوزات الباقات — إذ تُنشأ نهائيةً بسعر الباقة مباشرةً.",
        },
      },
      {
        kind: "link",
        href: "/admin/pricing",
        label: { en: "Open Vehicle Class", ar: "فتح فئة السيارة" },
      },
      {
        kind: "link",
        href: "/admin/cities",
        label: { en: "Open Cities (per-city prices)", ar: "فتح المدن (أسعار لكل مدينة)" },
      },
    ],
  },

  // ─────────────────────────── Admin: Cities & destinations ───────────────────────────
  {
    slug: "cities-destinations",
    order: 60,
    roles: ["admin"],
    title: { en: "Cities & destinations", ar: "المدن والوجهات" },
    summary: {
      en: "Add a destination and its airports, set per-city prices, and choose a landmark icon.",
      ar: "أضِف وجهة ومطاراتها، واضبط أسعارها لكل مدينة، واختر أيقونة معلَم.",
    },
    body: [
      {
        kind: "paragraph",
        text: {
          en: "The Cities page manages destinations, their airports, and everything priced per city. Riyadh is the origin; the other cities are the destinations customers can travel to. Journey steps stay the same for every city — only prices and availability differ.",
          ar: "تدير صفحة “المدن” الوجهات ومطاراتها وكل ما يُسعَّر لكل مدينة. الرياض هي مدينة الانطلاق؛ والمدن الأخرى هي الوجهات التي يمكن للعملاء السفر إليها. وتبقى خطوات الرحلة ثابتة لكل مدينة — ولا يختلف إلّا السعر والتوفّر.",
        },
      },
      {
        kind: "heading",
        text: { en: "Adding a destination", ar: "إضافة وجهة" },
      },
      {
        kind: "steps",
        items: [
          { en: "Add a city with its code, English and Arabic names, and country code.", ar: "أضِف مدينة برمزها واسمَيها بالإنجليزية والعربية ورمز دولتها." },
          { en: "Add its airports (code, timezone, terminals).", ar: "أضِف مطاراتها (الرمز، المنطقة الزمنية، الصالات)." },
          { en: "Set the trip step prices and the airport lounge prices for that city, per car class.", ar: "اضبط أسعار خطوات الرحلة وأسعار صالات المطار لتلك المدينة، لكل فئة سيارة." },
          { en: "Set the city price multiplier if this city should be scaled relative to the base prices.", ar: "اضبط معامل سعر المدينة إذا كان ينبغي تعديل هذه المدينة نسبةً إلى الأسعار الأساسية." },
        ],
      },
      {
        kind: "callout",
        tone: "tip",
        text: {
          en: "Remember: a service with no price is hidden from customers in that city. Leave a price blank to hide a step; set one to offer it.",
          ar: "تذكّر: الخدمة بلا سعر تكون مخفية عن العملاء في تلك المدينة. اترك السعر فارغًا لإخفاء خطوة، وحدّده لتقديمها.",
        },
      },
      {
        kind: "image",
        file: "add-city.png",
        alt: {
          en: "The Cities page: city details, airports, and per-city price fields.",
          ar: "صفحة المدن: بيانات المدينة والمطارات وحقول الأسعار لكل مدينة.",
        },
        caption: {
          en: "Adding a destination and its per-city prices.",
          ar: "إضافة وجهة وأسعارها لكل مدينة.",
        },
      },
      {
        kind: "heading",
        text: { en: "The landmark icon", ar: "أيقونة المعلَم" },
      },
      {
        kind: "paragraph",
        text: {
          en: "Each city shows a small line-art landmark on its destination card. In the landmark picker you can leave it on Auto (a sensible icon is chosen from the city, e.g. Big Ben for London), or pick one from the curated set — Eiffel Tower, Burj Khalifa, Pyramids, Kingdom Centre, and more, plus generic options like tower, mosque, arch, and beach.",
          ar: "تعرض كل مدينة معلَمًا صغيرًا بأسلوب الخطوط على بطاقة وجهتها. في مُنتقي المعالم يمكنك تركه على “تلقائي” (تُختار أيقونة مناسبة من المدينة، مثل “بيغ بن” للندن)، أو اختيار واحدة من المجموعة المنسّقة — برج إيفل، وبرج خليفة، والأهرامات، وبرج المملكة، وغيرها، إضافةً إلى خيارات عامّة كالبرج والمسجد والقوس والشاطئ.",
        },
      },
      {
        kind: "callout",
        tone: "info",
        text: {
          en: "The landmark picker is live and admin-controlled. The icon library itself is a fixed, curated set drawn in code — you choose from the presets; adding a brand-new icon needs a developer to add its artwork.",
          ar: "مُنتقي المعالم متاح ويتحكّم به المسؤول. أمّا مكتبة الأيقونات نفسها فهي مجموعة ثابتة منسّقة مرسومة في الكود — فأنت تختار من الجاهز؛ وإضافة أيقونة جديدة كليًا تتطلّب مطوّرًا لإضافة رسمها.",
        },
      },
      {
        kind: "link",
        href: "/admin/cities",
        label: { en: "Open Cities", ar: "فتح المدن" },
      },
    ],
  },

  // ─────────────────────────── Admin: Staff & drivers ───────────────────────────
  {
    slug: "staff-and-drivers",
    order: 70,
    roles: ["admin"],
    title: { en: "Staff & drivers", ar: "الطاقم والسائقون" },
    summary: {
      en: "Create and manage operations employees, drivers, and admin accounts, and how activation works.",
      ar: "إنشاء وإدارة موظفي العمليات والسائقين وحسابات المسؤولين، وكيفية عمل التفعيل.",
    },
    body: [
      {
        kind: "paragraph",
        text: {
          en: "Manage operations staff on the Employees page and drivers on the Drivers page. Superadmins additionally manage admin accounts on the Admins page.",
          ar: "أدِر موظفي العمليات من صفحة “الموظفون” والسائقين من صفحة “السائقون”. ويدير المسؤولون الأعلى (Superadmin) إضافةً إلى ذلك حسابات المسؤولين من صفحة “المسؤولون”.",
        },
      },
      {
        kind: "heading",
        text: { en: "Creating an account", ar: "إنشاء حساب" },
      },
      {
        kind: "steps",
        items: [
          { en: "Enter the person's full name, email, and optional phone, and add them.", ar: "أدخل الاسم الكامل للشخص وبريده الإلكتروني وهاتفه (اختياري)، ثم أضِفه." },
          { en: "The account is created “pending activation” with no password; a one-time setup link is emailed so the new user sets their own password.", ar: "يُنشأ الحساب بحالة “بانتظار التفعيل” دون كلمة مرور؛ ويُرسَل رابط تفعيل لمرة واحدة إلى البريد ليضع المستخدم الجديد كلمة مروره." },
          { en: "Until they activate, the account shows as Pending.", ar: "وإلى أن يفعّل الحساب، يظهر بحالة “بانتظار التفعيل”." },
        ],
      },
      {
        kind: "heading",
        text: { en: "Managing accounts", ar: "إدارة الحسابات" },
      },
      {
        kind: "bullets",
        items: [
          { en: "Activate / Deactivate controls whether a person can sign in. You cannot deactivate your own account.", ar: "“تفعيل / تعطيل” يتحكّم في قدرة الشخص على تسجيل الدخول. ولا يمكنك تعطيل حسابك أنت." },
          { en: "Reset password re-sends the setup link (and invalidates the current password for an already-active account).", ar: "“إعادة تعيين كلمة المرور” يعيد إرسال رابط التفعيل (ويُبطل كلمة المرور الحالية لحساب مفعّل بالفعل)." },
          { en: "A green dot marks who is online now.", ar: "النقطة الخضراء تشير إلى مَن هو متصل الآن." },
        ],
      },
      {
        kind: "callout",
        tone: "warning",
        text: {
          en: "Creating or (de)activating admin accounts is reserved for Superadmins. Any admin can create and manage employees and drivers.",
          ar: "إنشاء حسابات المسؤولين أو تفعيلها/تعطيلها محصور بالمسؤولين الأعلى (Superadmin). ويمكن لأي مسؤول إنشاء الموظفين والسائقين وإدارتهم.",
        },
      },
      {
        kind: "link",
        href: "/admin/employees",
        label: { en: "Open Employees", ar: "فتح الموظفين" },
      },
      {
        kind: "link",
        href: "/admin/drivers",
        label: { en: "Open Drivers", ar: "فتح السائقين" },
      },
    ],
  },

  // ─────────────────────────── Admin: Settings ───────────────────────────
  {
    slug: "settings",
    order: 80,
    roles: ["admin"],
    title: { en: "Settings", ar: "الإعدادات" },
    summary: {
      en: "Integrations (WhatsApp & email) and the read-only reference lists for journey steps and car categories.",
      ar: "التكاملات (واتساب والبريد) والقوائم المرجعية للاطّلاع فقط لخطوات الرحلة وفئات السيارات.",
    },
    body: [
      {
        kind: "paragraph",
        text: {
          en: "The Settings page is organised into tabs.",
          ar: "تُنظَّم صفحة الإعدادات في تبويبات.",
        },
      },
      {
        kind: "bullets",
        items: [
          { en: "WhatsApp / Integrations — the WhatsApp business number and email provider settings, plus a test-email tool to confirm email is working.", ar: "واتساب / التكاملات — رقم واتساب التجاري وإعدادات مزوّد البريد، إضافةً إلى أداة بريد تجريبي للتأكّد من عمل البريد." },
          { en: "Journey Steps — a reference-only list of the trip steps (defined in code).", ar: "خطوات الرحلة — قائمة للاطّلاع فقط بخطوات الرحلة (معرّفة في الكود)." },
          { en: "Car Categories — a reference-only view of the car classes.", ar: "فئات السيارات — عرض للاطّلاع فقط بفئات السيارات." },
        ],
      },
      {
        kind: "callout",
        tone: "info",
        text: {
          en: "The Journey Steps and Car Categories tabs are read-only reference. Prices are managed on the Cities page (per city), and service availability is controlled there too by setting or clearing a price.",
          ar: "تبويبا “خطوات الرحلة” و“فئات السيارات” للاطّلاع فقط. وتُدار الأسعار من صفحة “المدن” (لكل مدينة)، ويُتحكَّم في توفّر الخدمة من هناك أيضًا عبر تحديد سعر أو مسحه.",
        },
      },
      {
        kind: "link",
        href: "/admin/settings",
        label: { en: "Open Settings", ar: "فتح الإعدادات" },
      },
    ],
  },

  // ─────────────────────────── Admin: How customers build a journey ───────────────────────────
  {
    slug: "how-customers-build-journeys",
    order: 90,
    roles: ["admin"],
    title: { en: "How a customer builds a journey", ar: "كيف يصمّم العميل رحلته" },
    summary: {
      en: "A thin walkthrough of the customer flow that produced the request in front of you.",
      ar: "شرح موجز لمسار العميل الذي أنتج الطلب المعروض أمامك.",
    },
    body: [
      {
        kind: "paragraph",
        text: {
          en: "Requests come from the public site, where a customer either picks a ready package or builds a custom journey. This is a short overview so you understand what generated a request — the customer-facing flow is still evolving, so treat the details as indicative.",
          ar: "تأتي الطلبات من الموقع العام، حيث يختار العميل باقة جاهزة أو يصمّم رحلة مخصّصة. وهذه نظرة موجزة لتفهم ما الذي أنتج الطلب — ومسار العميل لا يزال قيد التطوير، لذا اعتبر التفاصيل استرشادية.",
        },
      },
      {
        kind: "steps",
        items: [
          { en: "The customer chooses a destination city and dates, then selects the journey steps they want (home→airport, departure assistance, arrival, hotel transfer, chauffeur during the stay, and the return legs).", ar: "يختار العميل مدينة الوجهة والتواريخ، ثم يحدّد خطوات الرحلة المطلوبة (المنزل←المطار، ومساعدة المغادرة، والوصول، والتوصيل للفندق، والسائق أثناء الإقامة، ومراحل العودة)." },
          { en: "For each step they pick a service (car only, meet & assist, fast track, or a combination) and a car class, and enter flight and location details.", ar: "لكل خطوة يختار خدمة (سيارة فقط، أو استقبال ومساعدة، أو مسار سريع، أو مزيجًا) وفئة سيارة، ويدخل تفاصيل الرحلة الجوية والمواقع." },
          { en: "They verify their phone/email, review the estimated total, and submit — which creates the request you see, at status Request Received.", ar: "يؤكّد هاتفه/بريده، ويراجع الإجمالي التقديري، ويرسل — فيُنشأ الطلب الذي تراه بحالة “تم استلام الطلب”." },
        ],
      },
      {
        kind: "callout",
        tone: "info",
        text: {
          en: "The amount the customer saw is an estimate. Your job on the request detail page is to confirm the final price and arrange the trip.",
          ar: "المبلغ الذي رآه العميل تقديري. ومهمتك في صفحة تفاصيل الطلب هي تأكيد السعر النهائي وترتيب الرحلة.",
        },
      },
    ],
  },

  // ─────────────────────────── Shared: Troubleshooting / FAQ ───────────────────────────
  {
    slug: "troubleshooting-faq",
    order: 200,
    roles: ["admin", "employee", "driver"],
    title: { en: "Troubleshooting & FAQ", ar: "استكشاف الأخطاء والأسئلة الشائعة" },
    summary: {
      en: "Common questions about sign-in, assignments, prices, and statuses.",
      ar: "أسئلة شائعة حول تسجيل الدخول والإسناد والأسعار والحالات.",
    },
    body: [
      {
        kind: "heading",
        text: { en: "I can't sign in / my link expired", ar: "لا أستطيع تسجيل الدخول / انتهت صلاحية رابطي" },
      },
      {
        kind: "paragraph",
        text: {
          en: "Setup links are one-time and short-lived. Request a fresh link from your login page, or ask an admin to Reset password for your account. If your account was deactivated, an admin must reactivate it.",
          ar: "روابط التفعيل لمرة واحدة وقصيرة الأمد. اطلب رابطًا جديدًا من صفحة تسجيل الدخول، أو اطلب من مسؤول “إعادة تعيين كلمة المرور” لحسابك. وإذا عُطِّل حسابك، فلا بدّ أن يعيد مسؤول تفعيله.",
        },
      },
      {
        kind: "heading",
        text: { en: "A request isn't showing for the employee/driver", ar: "لا يظهر الطلب للموظف/السائق" },
      },
      {
        kind: "paragraph",
        text: {
          en: "Operations employees only see requests assigned to them, and drivers only see tasks assigned to them. If someone is missing a request, an admin should assign the employee and the driver on the request detail page.",
          ar: "يرى موظفو العمليات الطلبات المُسندة إليهم فقط، ويرى السائقون المهام المُسندة إليهم فقط. وإذا كان الطلب ناقصًا لدى أحدهم، فينبغي أن يُسند مسؤول الموظفَ والسائقَ من صفحة تفاصيل الطلب.",
        },
      },
      {
        kind: "heading",
        text: { en: "The price looks wrong", ar: "يبدو السعر خاطئًا" },
      },
      {
        kind: "paragraph",
        text: {
          en: "The Estimated Total is generated from the per-city prices, car class, lounges, and city multiplier. If a service is unexpectedly missing or priced oddly, check that city's prices on the Cities page. An admin can then confirm or adjust the Final price on the request, always with a reason.",
          ar: "يُحتسَب الإجمالي التقديري من أسعار المدينة وفئة السيارة والصالات ومعامل المدينة. وإذا كانت خدمة مفقودة على غير المتوقّع أو سعرها غريبًا، فتحقّق من أسعار تلك المدينة في صفحة “المدن”. ثم يمكن لمسؤول تأكيد السعر النهائي أو تعديله على الطلب، مع ذكر السبب دائمًا.",
        },
      },
      {
        kind: "heading",
        text: { en: "Can I undo a status change?", ar: "هل يمكنني التراجع عن تغيير الحالة؟" },
      },
      {
        kind: "paragraph",
        text: {
          en: "Statuses aren't locked to a one-way sequence — an admin can set a different status if one was chosen by mistake. Every change is recorded in the status history, so the trail stays clear.",
          ar: "الحالات ليست مقيّدة بتسلسل باتجاه واحد — إذ يمكن لمسؤول ضبط حالة مختلفة إذا اختِيرت إحداها بالخطأ. ويُسجَّل كل تغيير في سجلّ الحالات، فيبقى المسار واضحًا.",
        },
      },
      {
        kind: "heading",
        text: { en: "Who do I contact?", ar: "بمن أتواصل؟" },
      },
      {
        kind: "paragraph",
        text: {
          en: "The RTD business WhatsApp line is +966 55 083 2444. Operations staff should escalate anything blocking a request to an admin from the request page.",
          ar: "خطّ واتساب RTD التجاري هو +966 55 083 2444. وعلى فريق العمليات تصعيد أي أمر يعطّل طلبًا إلى مسؤول من صفحة الطلب.",
        },
      },
    ],
  },
];
