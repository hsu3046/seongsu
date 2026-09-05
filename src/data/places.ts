export type Locale = 'en' | 'ja';
export type TimeOfDay = 'morning' | 'afternoon' | 'night';
export type PlaceKind = 'coffee' | 'bakery' | 'objects' | 'courtyard' | 'garden';
export type PlaceId = 'brick' | 'butter' | 'objects' | 'courtyard' | 'grove';
export interface Point { x: number; y: number }
export interface Place {
  id: PlaceId;
  kind: PlaceKind;
  number: string;
  name: string;
  localName: string;
  color: string;
  tint: string;
  category: Record<Locale, string>;
  note: Record<Locale, string>;
  description: Record<Locale, string>;
  detail: Record<Locale, string>;
  moment: Record<Locale, string>;
  entrance: Point;
  building: { x: number; y: number; w: number; h: number };
}

export const places: readonly Place[] = [
  {
    id: 'brick', kind: 'coffee', number: '01', name: 'Brick & Bean', localName: '브릭 앤 빈',
    color: '#b6573f', tint: '#f2dfd0',
    category: { en: 'Coffee & conversation', ja: 'コーヒーとおしゃべり' },
    note: { en: 'Good coffee. Old bricks.', ja: '古いレンガと、おいしい一杯。' },
    description: {
      en: 'An old workshop, a new ritual. Follow the smell of freshly roasted beans into a little café built around the things worth keeping.',
      ja: '古い工房に生まれた、新しい日常。焙煎したての香りに誘われて、大切なものを残した小さなカフェへ。',
    },
    detail: { en: 'Find a seat by the arched window. This is a place for slow sips, warm conversations, and absolutely no hurry.', ja: 'アーチ窓のそばに座って、ゆっくり一杯。おしゃべりを楽しんで。ここでは急がなくて大丈夫。' },
    moment: { en: 'A quiet morning, a warm flat white.', ja: '静かな朝に、温かいフラットホワイト。' },
    entrance: { x: 384, y: 456 }, building: { x: 272, y: 208, w: 224, h: 192 },
  },
  {
    id: 'butter', kind: 'bakery', number: '02', name: 'Butter Notes', localName: '버터 노츠',
    color: '#b08643', tint: '#f0e7c7',
    category: { en: 'Something freshly baked', ja: '焼きたてのしあわせ' },
    note: { en: 'Follow the buttery little trail.', ja: 'バターの香りをたどって。' },
    description: { en: 'A butter-yellow awning, a handwritten menu, and the kind of smell that makes you change your plans. There is always room for one more pastry.', ja: 'バター色のひさしと手書きのメニュー。思わず予定を変えてしまう香り。ペストリーは、もうひとつだけ。' },
    detail: { en: 'The tiny counter is the heart of the room. Watch the last batch come out of the oven, then take your treat back into the sunshine.', ja: '小さなカウンターが、このお店の中心。オーブンから焼き上がるのを眺めたら、おやつを持って日なたへ。' },
    moment: { en: 'An afternoon pause, something flaky.', ja: '午後のひと休みに、サクサクのおやつ。' },
    entrance: { x: 928, y: 456 }, building: { x: 816, y: 224, w: 224, h: 176 },
  },
  {
    id: 'objects', kind: 'objects', number: '03', name: 'Objects & Days', localName: '오브젝트 앤 데이즈',
    color: '#60736a', tint: '#e0e5d9',
    category: { en: 'Objects with a story', ja: '物語のある道具' },
    note: { en: 'Little things, thoughtfully made.', ja: '小さなものに、丁寧な想い。' },
    description: { en: 'Everyday objects that ask you to look a little closer. A neighborhood studio for handmade ceramics, small editions, and happy discoveries.', ja: '毎日の道具を、少しだけじっくり見る。手作りの陶器や小さな作品に出会える、街角のスタジオ。' },
    detail: { en: 'Look for the shelf of imperfect cups. Each piece carries the hand of its maker, and no two are quite the same.', ja: '少し不揃いなカップの棚を探してみて。作り手の手の跡が残り、同じものはひとつもありません。' },
    moment: { en: 'Take home a story, even just in your head.', ja: '心の中に、小さな物語を持ち帰ろう。' },
    entrance: { x: 928, y: 808 }, building: { x: 816, y: 576, w: 208, h: 176 },
  },
  {
    id: 'courtyard', kind: 'courtyard', number: '04', name: 'Courtyard 05', localName: '코트야드 05',
    color: '#9e664e', tint: '#eddfd4',
    category: { en: 'A café, a little hidden', ja: '中庭の隠れ家カフェ' },
    note: { en: 'A small escape between the bricks.', ja: 'レンガの間の、小さな逃避行。' },
    description: { en: 'Turn off the main street and into a courtyard that feels like a secret. Brick walls, climbing greenery, and a table with your name on it.', ja: '大通りから曲がると、秘密のような中庭。レンガの壁、つる植物、そしてあなたを待つテーブル。' },
    detail: { en: 'Stay until the little lamps switch on. The afternoon turns into evening gently here, one warm window at a time.', ja: '小さなランプが灯るまで、もう少し。窓に明かりがひとつずつ灯り、午後がゆっくり夜に変わります。' },
    moment: { en: 'The last light of the day, out in the courtyard.', ja: '中庭で楽しむ、一日の最後の光。' },
    entrance: { x: 384, y: 808 }, building: { x: 272, y: 576, w: 224, h: 176 },
  },
  {
    id: 'grove', kind: 'garden', number: '05', name: 'Little Grove', localName: '작은 숲',
    color: '#6b8155', tint: '#e1e8ce',
    category: { en: 'A breath of green', ja: '緑の中で深呼吸' },
    note: { en: 'A bench. A breeze. Just be.', ja: 'ベンチと、そよ風。それだけで。' },
    description: { en: 'A pocket of green at the end of your little walk. Nothing to buy, nowhere to be. Just a few trees and a good place to catch your breath.', ja: '小さな散歩の終わりに、緑のポケット。買うものも、急ぐ用事もなく。木々に囲まれて、ひと息つこう。' },
    detail: { en: 'You have wandered, discovered, and made a few memories. Pick a bench, open your passport, and look back at your day.', ja: '歩いて、見つけて、思い出を集めて。ベンチに座ってパスポートを開き、今日を振り返ってみよう。' },
    moment: { en: 'A little room to breathe, any time of day.', ja: 'いつでも、深呼吸できる場所。' },
    entrance: { x: 1152, y: 808 }, building: { x: 1056, y: 560, w: 192, h: 192 },
  },
];

export const placeIds = places.map((place) => place.id);
export const findPlace = (id: PlaceId): Place => places.find((place) => place.id === id)!;
export const WORLD = { width: 1280, height: 1024 };
export const SPAWN: Point = { x: 640, y: 592 };
