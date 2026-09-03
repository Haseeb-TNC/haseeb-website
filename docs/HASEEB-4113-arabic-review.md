# HASEEB-4113 — Arabic copy review (copywriter pass on §5 "Copy of record")

Scope: tone, register and product-vocabulary alignment only. No meaning changes, no
new claims. EN untouched. `hero.support` and the three form labels are locked and
carried through verbatim.

## 1. Key-by-key

| key | AR draft | AR recommended | reason |
|---|---|---|---|
| `meta.title` | حسيب — برنامج محاسبة يفهم عملك. | حسيب — برنامج محاسبة يفهم عملك. | keep |
| `meta.description` | حسيب مصمّم للأعمال الكويتية. يجهّز القيود، ويسألك عندما ينقصه شيء، ويجيبك بلغة بسيطة. الدفعة التأسيسية قيد التشكيل. | حسيب مصمّم للأعمال الكويتية. يجهّز القيود، ويسألك عندما ينقص شيء، ويجيب عن أسئلتك بلغة بسيطة. الدفعة التأسيسية قيد التشكيل. | «ينقصه» attaches the lack to Haseeb; EN says «your questions» |
| `nav.how` | كيف يعمل | كيف يعمل | keep |
| `nav.kuwait` | الكويت | الكويت | keep |
| `nav.cohort` | الدفعة التأسيسية | الدفعة التأسيسية | keep |
| `nav.lang` | English | English | keep |
| `nav.cta` | انضم إلى الدفعة التأسيسية | انضم إلى الدفعة التأسيسية | keep |
| `nav.langAria` | التبديل إلى الإنجليزية | التبديل إلى الإنجليزية | keep |
| `hero.h1` | كن في المقدمة مع برنامج محاسبة يفهم عملك. | كن في المقدّمة مع برنامج محاسبة يفهم عملك. | shadda consistency with مصمّم / يجهّز |
| `hero.support` | حسيب مصمّم للأعمال الكويتية. | حسيب مصمّم للأعمال الكويتية. | LOCKED — verbatim |
| `hero.sub` | يجهّز القيود، ويسألك عندما ينقصه شيء، ويجيبك عن أسئلتك بلغة بسيطة. | يجهّز القيود، ويسألك عندما ينقص شيء، ويجيب عن أسئلتك بلغة بسيطة. | same two fixes; matches `how.asks.body` wording |
| `hero.cta` | انضم إلى الدفعة التأسيسية | انضم إلى الدفعة التأسيسية | keep |
| `hero.secondary` | شاهد كيف يعمل | شاهد كيف يعمل | keep |
| `hero.fact` | الدفعة التأسيسية · 8–12 شركة كويتية · بإشراف من اليوم الأول | الدفعة التأسيسية · 8–12 شركة كويتية · بإشراف منذ اليوم الأول | «منذ» is the correct particle for from-day-one |
| headline **A** (current) | كن في المقدمة مع برنامج محاسبة يفهم عملك. | كن في المقدّمة مع برنامج محاسبة يفهم عملك. | as `hero.h1` |
| headline **B** | محاسبة تنجز العمل، وتسألك عندما تحتاجك. | محاسبة تُنجز العمل، وتسألك حين تحتاج إليك. | two feminine verbs in a row read tangled; «تحتاج إليك» disambiguates |
| headline **C** | دفاترك جاهزة لك. وأنت تعتمد. | دفاترك مُجهَّزة لك. وأنت تعتمد. | EN is "prepared", not "ready"; ties to يجهّز |
| headline **D** | برنامج محاسبة مصمّم للكويت ويفهم عملك. | برنامج محاسبة مصمّم للكويت، ويفهم عملك. | comma for breath in a long headline |
| `seq.stage1` | 1 · تصل معاملة بنكية | 1 · تصل معاملة بنكية | keep |
| `seq.stage2` | 2 · حسيب ينظّم المعلومات | 2 · ينظّم حسيب المعلومات | verb-first reads as caption, not as a claim about Haseeb |
| `seq.stage3` | 3 · سؤال، فقط عندما ينقص شيء | 3 · سؤال، فقط عندما ينقص شيء | keep |
| `seq.stage4` | 4 · مسودة قيد متوازنة، جاهزة للاعتماد | 4 · مسودة قيد متوازنة، جاهزة للاعتماد | keep — product string |
| `seq.stage5` | 5 · تُحدَّث الدفاتر والتقرير | 5 · تُحدَّث الدفاتر والتقرير | keep |
| `seq.pause` | إيقاف الحركة مؤقتًا | إيقاف الحركة مؤقتًا | keep |
| `seq.play` | تشغيل الحركة | تشغيل الحركة | keep |
| `seq.srDescription` | حركة توضيحية: تُقرأ معاملة بنكية، يجهّز حسيب القيد، يسأل سؤالًا واحدًا عندما تنقص المعلومات، يعرض مسودة متوازنة، ثم تُحدَّث الدفاتر. | حركة توضيحية: تُقرأ معاملة بنكية، ويجهّز حسيب القيد، ويسأل سؤالًا واحدًا عندما تنقص المعلومات، ويعرض مسودة متوازنة، ثم تُحدَّث الدفاتر. | Arabic clause lists need و-linking; matters most when read aloud |
| `seq.preview` | معاينة المنتج · بيانات تجريبية | معاينة المنتج · بيانات تجريبية | keep |
| `how.h2` | حسيب يجهّز العمل، وأنت تعتمده. | حسيب يجهّز العمل، وأنت تعتمده. | keep — the حسيب/أنت parallel is the point |
| `how.intro` | يقرأ حسيب معاملاتك البنكية وفواتيرك، ويجهّز القيود المحاسبية، ويفصل ما هو واضح عمّا يحتاج انتباهك. | يقرأ حسيب معاملاتك البنكية وفواتيرك، ويجهّز القيود المحاسبية، ويفصل ما هو واضح عمّا يحتاج إلى انتباهك. | يحتاج takes إلى |
| `how.prepares.label` | يجهّز | يجهّز | keep |
| `how.prepares.status` | جاهز للاعتماد | جاهزة للاعتماد | the product's own pill string, verbatim |
| `how.prepares.body` | عندما تكون المعلومات واضحة، يجهّز حسيب القيد. وأنت تعتمده، قيدًا قيدًا أو دفعة واحدة. | عندما تكون المعلومات واضحة، يجهّز حسيب القيد. وأنت تعتمده — كل قيد بمفرده، أو الكل دفعة واحدة. | «قيدًا قيدًا» is stiff; product already phrases this |
| `how.prepares` row category | (EN only) | الاتصالات | AR page needs the category in Arabic; merchant string stays as the bank prints it |
| `how.asks.label` | يسأل | يسأل | keep |
| `how.asks.status` | يحتاج إجابة | بحاجة إلى إجابة | product construction for the same state |
| `how.asks.body` | عندما ينقص شيء، يسألك حسيب سؤالًا واحدًا. أجب عنه ويصبح القيد جاهزًا. | عندما ينقص شيء، يسألك حسيب سؤالًا واحدًا. أجب عنه، ويصبح القيد جاهزًا. | comma marks the cause-then-result beat |
| `how.asks` row label | (EN "Transfer") | تحويل | AR page; product term |
| `how.asks` row question | ما الغرض من هذه الدفعة؟ | ما الغرض من هذه الدفعة؟ | keep |
| `how.holds.label` | يتوقّف | يتوقّف | keep |
| `how.holds.status` | محجوز للمراجعة | موقوف للمراجعة | محجوز = reserved/booked; موقوف is the product's word for a parked item |
| `how.holds.body` | عندما لا تكفي المعلومات، يتوقّف حسيب. لا يُرحَّل شيء حتى تقرّر أنت أو محاسبك. | عندما لا تكفي المعلومات، يتوقّف حسيب. لا يُرحَّل شيء حتى تقرّر أنت أو محاسبك. | keep — «يُرحَّل» is the product's posting verb |
| `how.holds` row label | فاتورة مورّد | فاتورة مورّد | keep — product string |
| `how.holds` row note | المستند مفقود | المستند ناقص | مفقود = lost; ناقص = missing/not yet supplied |
| `how.close` | أنت من يتحكّم فيما يُعتمد. | أنت من يتحكّم فيما يُعتمد. | keep |
| `ask.eyebrow` | أسئلة بلغة بسيطة | أسئلة بلغة بسيطة | keep |
| `ask.h2` | تكلّم مع محاسبك كما تتكلّم مع أي شخص. | تكلّم مع محاسبك كما تتكلّم مع أي شخص. | keep — matches the launcher |
| `ask.body` | اسأل: من من العملاء لم يسدّد بعد؟ أو كم لدينا من نقد اليوم؟ وستحصل على إجابة بلغة بسيطة، بالعربية أو الإنجليزية. | اسأل: «أيّ العملاء لم يسدّدوا بعد؟» أو «كم لدينا من نقد اليوم؟» وستحصل على إجابة بلغة بسيطة، بالعربية أو الإنجليزية. | «من من» stutters; guillemets separate the quoted questions from the sentence |
| `ask.cta` | جرّب العرض التوضيحي | جرّب العرض التوضيحي | keep — button stays short; the badge carries "guided" |
| `kuwait.eyebrow` | مصمّم لهنا | مصمّم لهنا | keep — echoes the locked hero line |
| `kuwait.h2` | لا يعمل في الكويت فقط، بل يفهم الكويت. | لا يعمل في الكويت فقط، بل يفهم الكويت. | keep |
| `kuwait.body` | تجّار الكويت. الدينار الكويتي بثلاث خانات عشرية. صيغ كشوف الحسابات البنكية المحلية المدعومة. متطلبات الأعمال والتقارير الكويتية. | تجّار الكويت. الدينار الكويتي بثلاث منازل عشرية. تنسيقات مدعومة لكشوف الحسابات البنكية المحلية. متطلبات الأعمال والتقارير الكويتية. | product says منازل عشرية / تنسيقات; four-noun stack unwound |
| `kuwait.chips[0]` | د.ك · 3 خانات عشرية | د.ك · 3 منازل عشرية | product term |
| `kuwait.chips[1]` | تسويات كي نت | تسويات كي-نت | product spells it كي-نت |
| `kuwait.chips[2]` | صيغ الكشوف المحلية | تنسيقات الكشوف المحلية | product term for formats |
| `kuwait.chips[3]` | التجّار الكويتيون | التجّار الكويتيون | keep |
| `cohort.eyebrow` | الدفعة التأسيسية | الدفعة التأسيسية | keep |
| `cohort.h2` | كن من أوائل الشركات في الكويت التي تستخدم حسيب. | كن من أوائل الشركات في الكويت التي تستخدم حسيب. | keep |
| `cohort.body` | نختار من 8 إلى 12 شركة خدمات كويتية للدفعة التأسيسية من حسيب. | نختار حاليًا من 8 إلى 12 شركة خدمات كويتية لدفعة حسيب التأسيسية. | «الدفعة من حسيب» is a calque; «حاليًا» carries the EN present continuous |
| `cohort.bullets[0]` | تهيئة عن قرب | تهيئة عن قرب | keep |
| `cohort.bullets[1]` | تواصل مباشر مع الفريق المؤسس | تواصل مباشر مع الفريق المؤسس | keep |
| `cohort.bullets[2]` | بداية بإشراف دقيق | بداية بإشراف دقيق | keep |
| `form.h3` | قدّم طلبًا لمقعد تأسيسي | قدّم طلبًا لمقعد تأسيسي | keep |
| `form.intro` | نراجع كل طلب شخصيًا. لا نطلب أي معلومات مالية للتقديم. | نراجع كل طلب شخصيًا. لا نطلب أي معلومات مالية للتقديم. | keep |
| `form.name` | الاسم | الاسم | LOCKED |
| `form.phone` | رقم الهاتف | رقم الهاتف | LOCKED |
| `form.email` | البريد الإلكتروني | البريد الإلكتروني | LOCKED |
| `form.namePh` | اسمك | اسمك | keep |
| `form.phonePh` | +965 … | +965 … | keep |
| `form.emailPh` | you@company.com | you@company.com | keep |
| `form.submit` | قدّم طلبك | قدّم طلبك | keep |
| `form.errName` | يرجى إضافة اسمك. | يرجى إدخال اسمك. | إضافة is a calque of "add"; إدخال is the product's verb for fields |
| `form.errPhone` | يرجى إضافة رقم هاتفك. | يرجى إدخال رقم هاتفك. | same |
| `form.errEmail` | يرجى إضافة بريد إلكتروني صحيح. | يرجى إدخال بريد إلكتروني صحيح. | same |
| `form.note` | سيفتح هذا تطبيق البريد لديك برسالة جاهزة إلى founder@haseeb.app. لا يُرسل شيء حتى تضغط «إرسال» هناك، ولا يُحفظ شيء على هذا الموقع. | سيفتح هذا تطبيق البريد لديك برسالة جاهزة إلى founder@haseeb.app. لا يُرسل شيء حتى تضغط «إرسال» هناك، ولا يُحفظ شيء على هذا الموقع. | keep |
| `form.success` | من المفترض أن يكون تطبيق البريد قد فُتح الآن وفيه طلبك. إذا لم يُفتح، راسل founder@haseeb.app مباشرة. | يُفترض أن يكون تطبيق البريد قد فُتح الآن ومعه طلبك. وإن لم يُفتح، راسل founder@haseeb.app مباشرة. | tightened; «ومعه» is warmer than «وفيه» |
| `form.founderLink` | تحدّث مع المؤسس | تحدّث مع المؤسس | keep |
| mailto trailer (AR) | (EN only) | — مُرسَل من نموذج الدفعة التأسيسية في haseeb.app | AR page needs the trailer; labels stay الاسم / رقم الهاتف / البريد الإلكتروني |
| `footer.terms` | شروط الموقع (+ « (بالإنجليزية)») | شروط الموقع (بالإنجليزية) | bake the note in: a separate key would break the identical-key-sets tripwire |
| `footer.privacy` | سياسة الخصوصية (+ note) | سياسة الخصوصية (بالإنجليزية) | same |
| `footer.contact` | info@haseeb.app | info@haseeb.app | keep |
| `footer.copyright` | © 2026 حسيب. جميع الحقوق محفوظة. | © 2026 حسيب. جميع الحقوق محفوظة. | keep |
| `footer.lang` | English | English | keep |
| `bot.launcher` | تكلّم مع محاسبك كما تتكلّم مع أي شخص | تكلّم مع محاسبك كما تتكلّم مع أي شخص | keep — founder's line, and it is correct |
| `bot.title` | المحاسب | المحاسب | keep — locked decision 8 |
| `bot.badge` | عرض توضيحي · بيانات تجريبية | عرض توضيحي موجّه · بيانات تجريبية | "guided" is the honesty label in EN; it must survive in AR |
| `bot.intro` | هذا عرض توضيحي على أرقام تجريبية لشركة افتراضية. اختر سؤالًا لترى كيف يجيب حسيب داخل المنتج. | هذا عرض توضيحي موجّه على أرقام تجريبية لشركة افتراضية. اختر سؤالًا لترى كيف يجيب حسيب داخل المنتج. | matches the badge |
| `bot.q1` | من من العملاء لم يسدّد بعد؟ | أيّ العملاء لم يسدّدوا بعد؟ | «من من» stutters when spoken |
| `bot.a1` | ثلاثة عملاء عليهم 12,450.000 د.ك إجمالًا. أكبرها الغانم للصناعات، الفاتورة 7012 بقيمة 8,000.000 د.ك، وكان موعدها الأسبوع الماضي. | ثلاثة عملاء عليهم 12,450.000 د.ك إجمالًا. أكبرهم الغانم للصناعات، الفاتورة 7012 بقيمة 8,000.000 د.ك، وقد استحقّت الأسبوع الماضي. | antecedent is عملاء → أكبرهم; استحقّت is the product's due-date root |
| `bot.q2` | كم عندنا نقد الآن؟ | كم عندنا نقد الآن؟ | keep — light Gulf tone, as briefed |
| `bot.a2` | 142,850.000 د.ك في حسابيك البنكيين اليوم. أكبر دفعة قادمة هي الرواتب في نهاية الشهر. | 142,850.000 د.ك في حسابيك البنكيين اليوم. وأكبر دفعة قادمة هي الرواتب في نهاية الشهر. | و links the two facts as one answer |
| `bot.q3` | كيف أرقام هذا الشهر؟ | كيف أرقام هذا الشهر؟ | keep |
| `bot.a3` | صافي الدخل هذا الشهر 9,708.660 د.ك. الإيرادات أعلى بنسبة 14%، معظمها من عقد الاستشارات الجديد، بينما بقيت المصروفات على حالها. | صافي الدخل هذا الشهر 9,708.660 د.ك. الإيرادات أعلى بنسبة 14٪، معظمها من عقد الاستشارات الجديد، بينما بقيت المصروفات على حالها. | product writes the Arabic percent sign ٪ after Western digits |
| `bot.footer` | داخل المنتج تأتي الإجابات من دفاترك أنت. هذه أرقام تجريبية. | داخل المنتج تأتي الإجابات من دفاترك أنت. هذه أرقام تجريبية. | keep |
| `bot.close` | إغلاق | إغلاق | keep |
| `bot.again` | اسأل سؤالًا آخر | اسأل سؤالًا آخر | keep |

Flags for marketing-strategist / brand-check:

- `bot.a1` (EN, final) names **Alghanim Industries** — a real Kuwaiti company — as an overdue
  debtor in sample data. The AR mirrors the EN faithfully, but the name should be cleared or
  swapped in both languages before ship. Not a copy fix; a decision.
- `how.prepares.status` is feminine (جاهزة) on a masculine noun (القيد) because it reproduces the
  product's pill string verbatim. That is deliberate — the pill on the site should read exactly
  as the pill in the product.

## 2. Register notes

The page copy sits in plain, warm MSA — the register of a Kuwaiti bank's own site: short
sentences, verb-first, no ornament, and every technical word taken from the product's own Arabic
rather than from a dictionary. The three chatbot questions stay one notch more spoken (كم عندنا
نقد الآن؟ / كيف أرقام هذا الشهر؟) so the demo sounds like a person asking, while every answer
returns to clean MSA because that is where the numbers live. Three habitual translation tells were
removed: the "add your name" calque, the "من من" stutter, and noun-stacks like صيغ كشوف الحسابات
البنكية المحلية المدعومة that no one says out loud.

## 3. Product-vocabulary matches

All paths under `/Users/tarekaljasem/Downloads/haseeb-corporate/src/i18n/locales/ar/`.

- جاهزة للاعتماد → `rbeBatchReview.json:45` (`state.ready`)
- بحاجة إلى إجابة → `migration-workspace.json:395-399`
- موقوف (held / parked) → `migration.json:102`, `lifecycle.json:12`
- للمراجعة / قيد المراجعة → `common.json:182`, `status-badge.json:4`
- يُرحَّل · ترحيل القيد → `financial.json:82`, `common.json:322`
- مسودة قيد محاسبي · متوازنة → `common.json:319`, `common.json:307`
- اعتمد كل بند بمفرده، أو اعتمد الكل دفعة واحدة → `reconciliation.json:280`
- منازل عشرية (3) → `setup.json:579`, `petty-cash.json:50` (minority variant خانات عشرية at `aging.json:134`)
- كي-نت → `paymentVouchers.json:44`
- تنسيقات … كشوف الحسابات → `setup.json:1046`
- كشف حساب بنكي → `onboarding.json:374`, `onboarding.json:380`
- معاملاتك · حركات البنك → `onboarding.json:492`, `sidebar.json:18`
- الدفاتر · دفاترك → `sidebar.json:4`, `onboarding.json:156`
- صافي الدخل هذا الشهر → `owner-today.json:12`
- الإيرادات · المصروفات → `forecast.json:25-26`
- التاجر → `rationale.json:4`
- فاتورة مورّد → `activity-log.json:39`
- تاريخ الاستحقاق (root for استحقّت) → `invoices.json:20`, `aging.json:30`
- الاتصالات → `obligation-declarations.json:41`
- تحويل بنكي → `settings.json:59`
- تهيئة → `onboarding.json:548`
- ٪ after Western digits → `onboarding.json:280`, `onboarding.json:382`
- أبريل (for the example-row dates) → `managementReport.json:15`
- صندوق المهام (used in the §6 storyboard) → `taskbox.json:2`

## 4. Paste block — recommended `ar.json` strings

`_headlineOptions` is not a shipping key; it carries the four polished options for the founder's
pick. Five subkeys are new because the brief supplies the Arabic inline but gives it no key:
`how.prepares.rowCategory`, `how.asks.rowLabel`, `how.asks.rowQuestion`, `how.holds.rowLabel`,
`how.holds.rowNote`, plus `form.mailtoTrailer` — each needs an EN counterpart to keep the
identical-key-sets tripwire green.

```json
{
  "meta": {
    "title": "حسيب — برنامج محاسبة يفهم عملك.",
    "description": "حسيب مصمّم للأعمال الكويتية. يجهّز القيود، ويسألك عندما ينقص شيء، ويجيب عن أسئلتك بلغة بسيطة. الدفعة التأسيسية قيد التشكيل."
  },
  "nav": {
    "how": "كيف يعمل",
    "kuwait": "الكويت",
    "cohort": "الدفعة التأسيسية",
    "lang": "English",
    "cta": "انضم إلى الدفعة التأسيسية",
    "langAria": "التبديل إلى الإنجليزية"
  },
  "hero": {
    "h1": "كن في المقدّمة مع برنامج محاسبة يفهم عملك.",
    "support": "حسيب مصمّم للأعمال الكويتية.",
    "sub": "يجهّز القيود، ويسألك عندما ينقص شيء، ويجيب عن أسئلتك بلغة بسيطة.",
    "cta": "انضم إلى الدفعة التأسيسية",
    "secondary": "شاهد كيف يعمل",
    "fact": "الدفعة التأسيسية · 8–12 شركة كويتية · بإشراف منذ اليوم الأول"
  },
  "_headlineOptions": {
    "A": "كن في المقدّمة مع برنامج محاسبة يفهم عملك.",
    "B": "محاسبة تُنجز العمل، وتسألك حين تحتاج إليك.",
    "C": "دفاترك مُجهَّزة لك. وأنت تعتمد.",
    "D": "برنامج محاسبة مصمّم للكويت، ويفهم عملك."
  },
  "seq": {
    "stage1": "1 · تصل معاملة بنكية",
    "stage2": "2 · ينظّم حسيب المعلومات",
    "stage3": "3 · سؤال، فقط عندما ينقص شيء",
    "stage4": "4 · مسودة قيد متوازنة، جاهزة للاعتماد",
    "stage5": "5 · تُحدَّث الدفاتر والتقرير",
    "pause": "إيقاف الحركة مؤقتًا",
    "play": "تشغيل الحركة",
    "srDescription": "حركة توضيحية: تُقرأ معاملة بنكية، ويجهّز حسيب القيد، ويسأل سؤالًا واحدًا عندما تنقص المعلومات، ويعرض مسودة متوازنة، ثم تُحدَّث الدفاتر.",
    "preview": "معاينة المنتج · بيانات تجريبية"
  },
  "how": {
    "h2": "حسيب يجهّز العمل، وأنت تعتمده.",
    "intro": "يقرأ حسيب معاملاتك البنكية وفواتيرك، ويجهّز القيود المحاسبية، ويفصل ما هو واضح عمّا يحتاج إلى انتباهك.",
    "prepares": {
      "label": "يجهّز",
      "status": "جاهزة للاعتماد",
      "body": "عندما تكون المعلومات واضحة، يجهّز حسيب القيد. وأنت تعتمده — كل قيد بمفرده، أو الكل دفعة واحدة.",
      "rowCategory": "الاتصالات"
    },
    "asks": {
      "label": "يسأل",
      "status": "بحاجة إلى إجابة",
      "body": "عندما ينقص شيء، يسألك حسيب سؤالًا واحدًا. أجب عنه، ويصبح القيد جاهزًا.",
      "rowLabel": "تحويل",
      "rowQuestion": "ما الغرض من هذه الدفعة؟"
    },
    "holds": {
      "label": "يتوقّف",
      "status": "موقوف للمراجعة",
      "body": "عندما لا تكفي المعلومات، يتوقّف حسيب. لا يُرحَّل شيء حتى تقرّر أنت أو محاسبك.",
      "rowLabel": "فاتورة مورّد",
      "rowNote": "المستند ناقص"
    },
    "close": "أنت من يتحكّم فيما يُعتمد."
  },
  "ask": {
    "eyebrow": "أسئلة بلغة بسيطة",
    "h2": "تكلّم مع محاسبك كما تتكلّم مع أي شخص.",
    "body": "اسأل: «أيّ العملاء لم يسدّدوا بعد؟» أو «كم لدينا من نقد اليوم؟» وستحصل على إجابة بلغة بسيطة، بالعربية أو الإنجليزية.",
    "cta": "جرّب العرض التوضيحي"
  },
  "kuwait": {
    "eyebrow": "مصمّم لهنا",
    "h2": "لا يعمل في الكويت فقط، بل يفهم الكويت.",
    "body": "تجّار الكويت. الدينار الكويتي بثلاث منازل عشرية. تنسيقات مدعومة لكشوف الحسابات البنكية المحلية. متطلبات الأعمال والتقارير الكويتية.",
    "chips": [
      "د.ك · 3 منازل عشرية",
      "تسويات كي-نت",
      "تنسيقات الكشوف المحلية",
      "التجّار الكويتيون"
    ]
  },
  "cohort": {
    "eyebrow": "الدفعة التأسيسية",
    "h2": "كن من أوائل الشركات في الكويت التي تستخدم حسيب.",
    "body": "نختار حاليًا من 8 إلى 12 شركة خدمات كويتية لدفعة حسيب التأسيسية.",
    "bullets": [
      "تهيئة عن قرب",
      "تواصل مباشر مع الفريق المؤسس",
      "بداية بإشراف دقيق"
    ]
  },
  "form": {
    "h3": "قدّم طلبًا لمقعد تأسيسي",
    "intro": "نراجع كل طلب شخصيًا. لا نطلب أي معلومات مالية للتقديم.",
    "name": "الاسم",
    "phone": "رقم الهاتف",
    "email": "البريد الإلكتروني",
    "namePh": "اسمك",
    "phonePh": "+965 …",
    "emailPh": "you@company.com",
    "submit": "قدّم طلبك",
    "errName": "يرجى إدخال اسمك.",
    "errPhone": "يرجى إدخال رقم هاتفك.",
    "errEmail": "يرجى إدخال بريد إلكتروني صحيح.",
    "note": "سيفتح هذا تطبيق البريد لديك برسالة جاهزة إلى founder@haseeb.app. لا يُرسل شيء حتى تضغط «إرسال» هناك، ولا يُحفظ شيء على هذا الموقع.",
    "success": "يُفترض أن يكون تطبيق البريد قد فُتح الآن ومعه طلبك. وإن لم يُفتح، راسل founder@haseeb.app مباشرة.",
    "founderLink": "تحدّث مع المؤسس",
    "mailtoTrailer": "— مُرسَل من نموذج الدفعة التأسيسية في haseeb.app"
  },
  "footer": {
    "terms": "شروط الموقع (بالإنجليزية)",
    "privacy": "سياسة الخصوصية (بالإنجليزية)",
    "contact": "info@haseeb.app",
    "copyright": "© 2026 حسيب. جميع الحقوق محفوظة.",
    "lang": "English"
  },
  "bot": {
    "launcher": "تكلّم مع محاسبك كما تتكلّم مع أي شخص",
    "title": "المحاسب",
    "badge": "عرض توضيحي موجّه · بيانات تجريبية",
    "intro": "هذا عرض توضيحي موجّه على أرقام تجريبية لشركة افتراضية. اختر سؤالًا لترى كيف يجيب حسيب داخل المنتج.",
    "q1": "أيّ العملاء لم يسدّدوا بعد؟",
    "a1": "ثلاثة عملاء عليهم 12,450.000 د.ك إجمالًا. أكبرهم الغانم للصناعات، الفاتورة 7012 بقيمة 8,000.000 د.ك، وقد استحقّت الأسبوع الماضي.",
    "q2": "كم عندنا نقد الآن؟",
    "a2": "142,850.000 د.ك في حسابيك البنكيين اليوم. وأكبر دفعة قادمة هي الرواتب في نهاية الشهر.",
    "q3": "كيف أرقام هذا الشهر؟",
    "a3": "صافي الدخل هذا الشهر 9,708.660 د.ك. الإيرادات أعلى بنسبة 14٪، معظمها من عقد الاستشارات الجديد، بينما بقيت المصروفات على حالها.",
    "footer": "داخل المنتج تأتي الإجابات من دفاترك أنت. هذه أرقام تجريبية.",
    "close": "إغلاق",
    "again": "اسأل سؤالًا آخر"
  }
}
```
