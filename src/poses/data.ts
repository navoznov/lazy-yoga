import type { Pose } from './types'

// Conservative content for a beginner with high blood pressure and poor flexibility:
// supported variants, natural breathing, no arms held overhead for long.
// Any pose where the head drops below the heart is tagged 'head-below-heart' (hold capped to 20 s).
export const POSES: Pose[] = [
  // --- warmup (chair) ---
  {
    id: 'neck-side-stretch',
    nameRu: 'Наклон головы к плечу',
    description:
      'Сядь ровно на стул, плечи опущены. Медленно наклони ухо к плечу, не помогая рукой, и почувствуй мягкое растяжение сбоку шеи. Так же медленно верни голову в центр.',
    cues: ['Медленно наклони ухо к плечу', 'Плечи опусти вниз'],
    holdSec: 20,
    bilateral: true,
    position: 'chair',
    phases: ['warmup'],
    areas: ['neck'],
    difficulty: 1,
    contraindications: [],
    imagePrompt:
      'Minimalist silhouette of a clothed person sitting upright on a chair, gently tilting the head toward one shoulder, plain light background.',
  },
  {
    id: 'chin-tuck',
    nameRu: 'Втягивание подбородка',
    description:
      'Сидя ровно, плавно отведи подбородок назад, будто делаешь двойной подбородок, макушка тянется вверх. Почувствуй вытяжение задней поверхности шеи, затем расслабься.',
    cues: ['Подбородок мягко назад, макушка вверх', 'Дыши свободно'],
    holdSec: 20,
    bilateral: false,
    position: 'chair',
    phases: ['warmup'],
    areas: ['neck', 'upper-back'],
    difficulty: 1,
    contraindications: [],
    imagePrompt:
      'Minimalist silhouette of a clothed person sitting upright on a chair, side view, chin gently drawn back to lengthen the back of the neck, plain light background.',
  },
  {
    id: 'shoulder-rolls',
    nameRu: 'Вращение плечами',
    description:
      'Сидя на стуле, руки свободно опущены. Медленно поднимай плечи вверх, отводи назад и опускай вниз большими кругами. Движение плавное, без рывков.',
    cues: ['Плечи вверх, назад и вниз', 'Двигайся медленно'],
    holdSec: 30,
    bilateral: false,
    position: 'chair',
    phases: ['warmup'],
    areas: ['shoulders', 'upper-back'],
    difficulty: 1,
    contraindications: [],
    imagePrompt:
      'Minimalist silhouette of a clothed person sitting on a chair with arms relaxed, rolling the shoulders backward, plain light background.',
  },
  {
    id: 'chair-cat-cow',
    nameRu: 'Кошка-корова на стуле',
    description:
      'Сядь на край стула, ладони на коленях. На вдохе мягко прогни спину и раскрой грудь, на выдохе округли спину и опусти подбородок. Двигайся в ритме дыхания, голова остаётся выше сердца.',
    cues: ['На вдохе раскрой грудь', 'На выдохе округли спину'],
    holdSec: 30,
    bilateral: false,
    position: 'chair',
    phases: ['warmup'],
    areas: ['spine', 'upper-back', 'lower-back'],
    difficulty: 1,
    contraindications: [],
    imagePrompt:
      'Minimalist silhouette of a clothed person sitting on the edge of a chair, hands on knees, gently rounding the spine, side view, plain light background.',
  },
  {
    id: 'chair-twist',
    nameRu: 'Скрутка на стуле',
    description:
      'Сядь на стул прямо, стопы на полу. На выдохе мягко поверни корпус в сторону, держась за спинку стула, без усилия руками. Почувствуй лёгкую скрутку вдоль позвоночника и плавно вернись в центр.',
    cues: ['Сначала вытянись вверх, потом поворачивайся', 'Не тяни себя руками'],
    holdSec: 25,
    bilateral: true,
    position: 'chair',
    phases: ['warmup'],
    areas: ['spine', 'lower-back'],
    difficulty: 1,
    contraindications: [],
    imagePrompt:
      'Minimalist silhouette of a clothed person sitting on a chair, torso gently twisted to one side with a hand resting on the chair back, plain light background.',
  },
  {
    id: 'seated-side-bend',
    nameRu: 'Боковой наклон сидя',
    description:
      'Сидя на стуле, опусти одну руку вдоль тела, другую положи на бедро или подними сбоку. Мягко наклонись в сторону и почувствуй растяжение боковой поверхности корпуса. Вернись в центр на вдохе.',
    cues: ['Тянись в сторону, а не вперёд', 'Обе ягодицы на стуле'],
    holdSec: 20,
    bilateral: true,
    position: 'chair',
    phases: ['warmup'],
    areas: ['spine', 'shoulders'],
    difficulty: 1,
    contraindications: [],
    imagePrompt:
      'Minimalist silhouette of a clothed person sitting on a chair, leaning gently sideways with one arm reaching over the head, plain light background.',
  },
  {
    id: 'wrist-stretch',
    nameRu: 'Растяжка запястий',
    description:
      'Вытяни руку вперёд ладонью от себя и другой рукой мягко отведи пальцы на себя, затем переверни ладонь вниз. Почувствуй растяжение предплечья, без боли.',
    cues: ['Мягко отведи пальцы на себя', 'Плечи расслаблены'],
    holdSec: 20,
    bilateral: true,
    position: 'chair',
    phases: ['warmup'],
    areas: ['shoulders'],
    difficulty: 1,
    contraindications: [],
    imagePrompt:
      'Minimalist silhouette of a clothed person sitting on a chair, one arm extended forward, the other hand gently pulling the fingers back, plain light background.',
  },

  // --- main: standing ---
  {
    id: 'mountain',
    nameRu: 'Поза горы',
    sanskrit: 'Tadasana',
    description:
      'Встань прямо, стопы на ширине таза, руки вдоль тела. Распредели вес на обе стопы, макушка тянется вверх, плечи расслаблены. Просто стой и спокойно дыши.',
    cues: ['Вес на обе стопы', 'Макушка тянется вверх'],
    holdSec: 30,
    bilateral: false,
    position: 'standing',
    phases: ['main'],
    areas: ['spine'],
    difficulty: 1,
    contraindications: [],
    imagePrompt:
      'Minimalist silhouette of a clothed person standing upright with feet hip-width apart and arms relaxed by the sides, plain light background.',
  },
  {
    id: 'standing-side-bend',
    nameRu: 'Боковой наклон стоя',
    description:
      'Стоя, положи одну руку на бедро, другую подними сбоку. Мягко наклонись в сторону, скользя рукой по бедру. Вернись в центр на вдохе и опусти руку.',
    cues: ['Тянись вверх и в сторону', 'Таз остаётся на месте'],
    holdSec: 20,
    bilateral: true,
    position: 'standing',
    phases: ['main'],
    areas: ['spine', 'shoulders'],
    difficulty: 1,
    contraindications: [],
    imagePrompt:
      'Minimalist silhouette of a clothed person standing, one hand on the thigh and the other arm arching overhead in a gentle side bend, plain light background.',
  },
  {
    id: 'chair-supported-half-fold',
    nameRu: 'Полунаклон с опорой на стул',
    sanskrit: 'Ardha Uttanasana',
    description:
      'Встань лицом к спинке стула, положи на неё ладони и отходи назад, пока спина не станет почти параллельна полу. Колени мягкие, голова на уровне рук, не опускай её. Чтобы выйти, подойди к стулу и медленно выпрямись.',
    cues: ['Спина длинная, колени мягкие', 'Голову не опускай'],
    holdSec: 20,
    bilateral: false,
    position: 'standing',
    phases: ['main'],
    areas: ['hamstrings', 'lower-back', 'shoulders'],
    difficulty: 1,
    contraindications: ['head-below-heart'],
    imagePrompt:
      'Minimalist silhouette of a clothed person with hands on the back of a chair, hips back and flat back parallel to the floor, knees slightly bent, side view, plain light background.',
  },
  {
    id: 'warrior-two',
    nameRu: 'Воин два',
    sanskrit: 'Virabhadrasana II',
    description:
      'Широко расставь ноги, разверни одну стопу наружу и слегка согни это колено над стопой. Руки разведи в стороны на уровне плеч или положи на пояс, если устают. Чтобы выйти, выпрями колено и поставь стопы параллельно.',
    cues: ['Колено слегка согни, не глубоко', 'Устали руки — положи их на пояс'],
    holdSec: 20,
    bilateral: true,
    position: 'standing',
    phases: ['main'],
    areas: ['hips'],
    difficulty: 2,
    contraindications: [],
    yogaApiKey: 'warrior-two',
    imagePrompt:
      'Minimalist silhouette of a clothed person in a shallow warrior two stance, front knee slightly bent, arms extended at shoulder height, plain light background.',
  },
  {
    id: 'wall-tree',
    nameRu: 'Дерево у стены',
    sanskrit: 'Vrksasana',
    description:
      'Встань боком к стене и положи на неё ладонь. Поставь стопу на щиколотку или икру опорной ноги, колено отведи в сторону. Держись за стену столько, сколько нужно, и плавно опусти ногу.',
    cues: ['Держись за стену, это нормально', 'Стопа на икре, не на колене'],
    holdSec: 20,
    bilateral: true,
    position: 'standing',
    phases: ['main'],
    areas: ['hips'],
    difficulty: 2,
    contraindications: [],
    yogaApiKey: 'tree',
    imagePrompt:
      'Minimalist silhouette of a clothed person standing beside a wall with one hand on it, the other foot resting on the inner calf of the standing leg, plain light background.',
  },

  // --- main: floor ---
  {
    id: 'cat-cow',
    nameRu: 'Кошка-корова',
    sanskrit: 'Marjaryasana-Bitilasana',
    description:
      'Встань на четвереньки, ладони под плечами, колени под тазом. На вдохе мягко прогни спину, на выдохе округли её, не опуская голову низко. Двигайся медленно, в ритме дыхания.',
    cues: ['На вдохе прогнись, на выдохе округлись', 'Голову держи на уровне спины'],
    holdSec: 20,
    bilateral: false,
    position: 'kneeling',
    phases: ['main'],
    areas: ['spine', 'lower-back', 'upper-back'],
    difficulty: 1,
    contraindications: ['head-below-heart'],
    yogaApiKey: 'cat',
    imagePrompt:
      'Minimalist silhouette of a clothed person on hands and knees with a gently rounded back, side view, plain light background.',
  },
  {
    id: 'childs-pose',
    nameRu: 'Поза ребёнка',
    sanskrit: 'Balasana',
    description:
      'Из положения на четвереньках разведи колени и опусти таз к пяткам, лоб положи на подушку или сложенные кулаки. Почувствуй, как расслабляется поясница. Выходи медленно, поднимая голову последней.',
    cues: ['Лоб на подушку, плечи расслабь', 'Поднимайся медленно'],
    holdSec: 20,
    bilateral: false,
    position: 'kneeling',
    phases: ['main'],
    areas: ['lower-back', 'hips'],
    difficulty: 1,
    contraindications: ['head-below-heart'],
    yogaApiKey: 'childs-pose',
    imagePrompt:
      'Minimalist silhouette of a clothed person kneeling with knees apart, hips toward heels, forehead resting on a pillow, arms forward, plain light background.',
  },
  {
    id: 'thread-the-needle',
    nameRu: 'Нить в иголку',
    description:
      'Стоя на четвереньках, протяни одну руку под другой и опусти плечо и висок на подушку. Почувствуй растяжение между лопатками. Вернись, опираясь на свободную руку.',
    cues: ['Висок на подушку', 'Плавно возвращайся'],
    holdSec: 20,
    bilateral: true,
    position: 'kneeling',
    phases: ['main'],
    areas: ['upper-back', 'shoulders'],
    difficulty: 2,
    contraindications: ['head-below-heart'],
    imagePrompt:
      'Minimalist silhouette of a clothed person on hands and knees, one arm threaded under the body with shoulder and temple resting on a pillow, plain light background.',
  },
  {
    id: 'low-lunge',
    nameRu: 'Низкий выпад',
    sanskrit: 'Anjaneyasana',
    description:
      'Из положения на коленях выстави одну ногу вперёд, стопа под коленом, заднее колено на мягкой опоре. Ладони на переднем бедре, корпус прямо, мягко подай таз вперёд. Почувствуй растяжение спереди бедра задней ноги.',
    cues: ['Руки на бедре, корпус прямо', 'Таз мягко вперёд'],
    holdSec: 20,
    bilateral: true,
    position: 'kneeling',
    phases: ['main'],
    areas: ['hips'],
    difficulty: 2,
    contraindications: [],
    imagePrompt:
      'Minimalist silhouette of a clothed person in a low kneeling lunge, back knee on a cushion, hands resting on the front thigh, upright torso, plain light background.',
  },
  {
    id: 'sphinx',
    nameRu: 'Сфинкс',
    sanskrit: 'Salamba Bhujangasana',
    description:
      'Ляг на живот, поставь предплечья на пол, локти под плечами. Мягко приподними грудь, поясница расслаблена, без напряжения. Медленно опустись на пол.',
    cues: ['Локти под плечами', 'Поясница расслаблена'],
    holdSec: 20,
    bilateral: false,
    position: 'prone',
    phases: ['main'],
    areas: ['spine', 'lower-back'],
    difficulty: 1,
    contraindications: [],
    yogaApiKey: 'sphinx',
    imagePrompt:
      'Minimalist silhouette of a clothed person lying on the stomach, propped up on forearms with elbows under shoulders, gentle chest lift, plain light background.',
  },
  {
    id: 'butterfly',
    nameRu: 'Бабочка',
    sanskrit: 'Baddha Konasana',
    description:
      'Сядь на сложенное одеяло, соедини стопы и разведи колени в стороны, стопы подальше от себя. Сиди прямо и позволь коленям опускаться под собственным весом. Чтобы выйти, помоги коленям подняться руками.',
    cues: ['Сядь повыше, спина прямая', 'Колени не дави'],
    holdSec: 30,
    bilateral: false,
    position: 'seated',
    phases: ['main'],
    areas: ['hips'],
    difficulty: 1,
    contraindications: [],
    yogaApiKey: 'butterfly',
    imagePrompt:
      'Minimalist silhouette of a clothed person sitting upright on a folded blanket, soles of the feet together, knees falling outward, plain light background.',
  },
  {
    id: 'bent-knee-seated-fold',
    nameRu: 'Наклон сидя с согнутыми коленями',
    sanskrit: 'Paschimottanasana',
    description:
      'Сядь на сложенное одеяло, ноги вперёд, колени заметно согни. Наклонись вперёд от таза, ладони на голенях, голова остаётся выше колен. Почувствуй мягкое растяжение задней поверхности ног и медленно выпрямись.',
    cues: ['Колени согнуты, тянись грудью вперёд', 'Голову не роняй'],
    holdSec: 20,
    bilateral: false,
    position: 'seated',
    phases: ['main'],
    areas: ['hamstrings', 'lower-back'],
    difficulty: 1,
    contraindications: ['head-below-heart'],
    imagePrompt:
      'Minimalist silhouette of a clothed person sitting on a folded blanket with knees bent, leaning forward from the hips with hands on the shins, plain light background.',
  },
  {
    id: 'seated-twist',
    nameRu: 'Скрутка сидя',
    sanskrit: 'Ardha Matsyendrasana',
    description:
      'Сядь на одеяло, одну ногу вытяни, другую согни и поставь стопу за колено вытянутой ноги. Обними согнутое колено и мягко повернись к нему, опора рукой сзади. Выходи, плавно разворачиваясь в центр.',
    cues: ['Вытянись вверх, потом поворачивайся', 'Дыши свободно'],
    holdSec: 25,
    bilateral: true,
    position: 'seated',
    phases: ['main'],
    areas: ['spine', 'lower-back', 'hips'],
    difficulty: 1,
    contraindications: [],
    yogaApiKey: 'half-lord-of-the-fishes',
    imagePrompt:
      'Minimalist silhouette of a clothed person sitting with one leg extended and the other knee bent and crossed over, torso gently twisting toward the bent knee, plain light background.',
  },

  // --- cooldown (supine) ---
  {
    id: 'knees-to-chest',
    nameRu: 'Колени к груди',
    sanskrit: 'Apanasana',
    description:
      'Лёжа на спине, подтяни согнутые колени к груди и обними их руками. Можно мягко покачаться из стороны в сторону, массируя поясницу. Медленно поставь стопы на пол.',
    cues: ['Обними колени', 'Поясница расслаблена'],
    holdSec: 30,
    bilateral: false,
    position: 'supine',
    phases: ['cooldown'],
    areas: ['lower-back', 'hips'],
    difficulty: 1,
    contraindications: [],
    imagePrompt:
      'Minimalist silhouette of a clothed person lying on the back hugging both bent knees toward the chest, plain light background.',
  },
  {
    id: 'supine-twist',
    nameRu: 'Скрутка лёжа',
    sanskrit: 'Supta Matsyendrasana',
    description:
      'Лёжа на спине, согни колени и мягко опусти их в одну сторону, руки разведены в стороны. Если колени не достают до пола, подложи под них подушку. Верни колени в центр медленно.',
    cues: ['Колени в сторону, плечи на полу', 'Расслабься и дыши'],
    holdSec: 40,
    bilateral: true,
    position: 'supine',
    phases: ['cooldown'],
    areas: ['spine', 'lower-back'],
    difficulty: 1,
    contraindications: [],
    imagePrompt:
      'Minimalist silhouette of a clothed person lying on the back, arms out to the sides, both bent knees dropped to one side onto a pillow, plain light background.',
  },
  {
    id: 'supine-figure-four',
    nameRu: 'Четвёрка лёжа',
    sanskrit: 'Sucirandhrasana',
    description:
      'Лёжа на спине с согнутыми коленями, положи щиколотку одной ноги на колено другой. Если хочется больше, подтяни нижнюю ногу к себе руками. Почувствуй растяжение в ягодице и медленно поставь стопы на пол.',
    cues: ['Стопа на колене, голова на полу', 'Без усилия, мягко'],
    holdSec: 40,
    bilateral: true,
    position: 'supine',
    phases: ['cooldown'],
    areas: ['hips', 'lower-back'],
    difficulty: 1,
    contraindications: [],
    imagePrompt:
      'Minimalist silhouette of a clothed person lying on the back with knees bent, one ankle crossed over the opposite knee, plain light background.',
  },
  {
    id: 'strap-hamstring-stretch',
    nameRu: 'Растяжка ноги с ремнём',
    sanskrit: 'Supta Padangusthasana',
    description:
      'Лёжа на спине, вторую ногу согни, стопа на полу. Накинь ремень или полотенце на стопу и подними ногу вверх, колено можно слегка согнуть. Почувствуй растяжение задней поверхности бедра и медленно опусти ногу.',
    cues: ['Колено можно слегка согнуть', 'Плечи и голова на полу'],
    holdSec: 40,
    bilateral: true,
    position: 'supine',
    phases: ['cooldown'],
    areas: ['hamstrings'],
    difficulty: 1,
    contraindications: [],
    imagePrompt:
      'Minimalist silhouette of a clothed person lying on the back, one leg raised with a strap around the foot, the other knee bent with foot on the floor, plain light background.',
  },
  {
    id: 'reclined-bound-angle',
    nameRu: 'Бабочка лёжа',
    sanskrit: 'Supta Baddha Konasana',
    description:
      'Лёжа на спине, соедини стопы и разведи колени, подложив под них подушки. Руки свободно на животе или вдоль тела. Чтобы выйти, помоги коленям соединиться руками.',
    cues: ['Колени на подушках', 'Отпусти напряжение в бёдрах'],
    holdSec: 60,
    bilateral: false,
    position: 'supine',
    phases: ['cooldown'],
    areas: ['hips'],
    difficulty: 1,
    contraindications: [],
    imagePrompt:
      'Minimalist silhouette of a clothed person lying on the back, soles of the feet together, knees falling outward onto pillows, plain light background.',
  },
  {
    id: 'legs-up-the-wall',
    nameRu: 'Ноги на стене',
    sanskrit: 'Viparita Karani',
    description:
      'Сядь боком к стене, ляг на спину и подними ноги на стену, таз остаётся на полу, без подушки под ним. Можно отодвинуться от стены и согнуть колени. Чтобы выйти, согни колени и перекатись на бок.',
    cues: ['Таз на полу, ноги расслаблены', 'Дыши спокойно и глубоко'],
    holdSec: 60,
    bilateral: false,
    position: 'supine',
    phases: ['cooldown'],
    areas: ['hamstrings', 'lower-back'],
    difficulty: 1,
    contraindications: [],
    imagePrompt:
      'Minimalist silhouette of a clothed person lying on the back on the floor with legs resting straight up against a wall, plain light background.',
  },
  {
    id: 'corpse',
    nameRu: 'Поза покоя',
    sanskrit: 'Savasana',
    description:
      'Ляг на спину, под голову положи подушку, под колени можно валик. Руки и ноги свободно, глаза закрыты, дыхание естественное. Чтобы выйти, перевернись на бок и медленно сядь.',
    cues: ['Расслабь всё тело', 'Просто наблюдай за дыханием'],
    holdSec: 120,
    bilateral: false,
    position: 'supine',
    phases: ['cooldown'],
    areas: ['spine'],
    difficulty: 1,
    contraindications: [],
    yogaApiKey: 'corpse',
    imagePrompt:
      'Minimalist silhouette of a clothed person lying flat on the back with a pillow under the head, arms relaxed by the sides, eyes closed, plain light background.',
  },
]
