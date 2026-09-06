import { footprints, project, streetArrival } from './geography.ts';
import type { GeoPoint, Point } from './geography.ts';
export { WORLD, SPAWN } from './geography.ts';
export type { Point } from './geography.ts';
export type Locale = 'en' | 'ja';
export type TimeOfDay = 'morning' | 'afternoon' | 'night';
export type PlaceKind = 'coffee' | 'fashion' | 'fragrance';
export type PlaceId = 'scene' | 'dior' | 'tamburins' | 'daelim' | 'musinsa';
export interface Place {
  id: PlaceId; kind: PlaceKind; number: string; name: string; localName: string; sign: string;
  color: string; tint: string;
  category: Record<Locale, string>; note: Record<Locale, string>;
  description: Record<Locale, string>; detail: Record<Locale, string>; moment: Record<Locale, string>;
  address: string; addressEn: string; source: string; sourceName: string; naverUrl: string;
  location: GeoPoint; footprintIds: string[];
  entrance: Point; building: { x: number; y: number; w: number; h: number };
}
type PlaceInput = Omit<Place, 'entrance' | 'building' | 'naverUrl'> & { street: string; naverId?: string };
function place(input: PlaceInput): Place {
  const points = footprints.filter((item) => input.footprintIds.includes(item.id)).flatMap((item) => item.points);
  const center = project(input.location);
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const x = points.length ? Math.min(...xs) : center.x - 40;
  const y = points.length ? Math.min(...ys) : center.y - 30;
  return { ...input,
    entrance: streetArrival(input.location, input.street),
    building: { x, y, w: points.length ? Math.max(...xs) - x : 80, h: points.length ? Math.max(...ys) - y : 60 },
    naverUrl: input.naverId ? `https://map.naver.com/p/entry/place/${input.naverId}` : `https://map.naver.com/p/search/${encodeURIComponent(input.localName + ' ' + input.address)}`,
  };
}

// Geographic anchors are OSM footprint centres/POIs, checked against Naver addresses.
// `entrance` is a virtual arrival on the street, not a surveyed physical doorway.
export const places: readonly Place[] = [
  place({
    id: 'scene', kind: 'coffee', number: '01', name: 'Scène', localName: '쎈느Scene', sign: 'SCÈNE',
    color: '#707f75', tint: '#e2e6dd', street: '연무장5길',
    address: '서울 성동구 연무장5길 20', addressEn: '20 Yeonmujang 5-gil, Seongdong-gu, Seoul',
    location: { longitude: 127.05344595, latitude: 37.544902825 }, footprintIds: ['475986015'], naverId: '1030871168',
    source: 'https://www.sceneseoul.com/', sourceName: 'Scène',
    category: { en: 'Coffee & a terrace', ja: 'カフェとテラス' },
    note: { en: 'A first pause off Achasan-ro.', ja: 'アチャサン路を曲がって、ひと休み。' },
    description: { en: 'A café on Yeonmujang 5-gil, a short walk west from Seongsu Station exit 4. This is the northern stop of our little neighborhood walk.', ja: '聖水駅4番出口から西へ歩いた、ヨンムジャン5ギルのカフェ。この散歩の北側の寄り道です。' },
    detail: { en: 'Continue south along the same lane to find Dior and Tamburins. Check Naver for current opening hours and events before visiting.', ja: '同じ路地を南へ進むと、ディオールとタンバリンズへ。営業時間やイベントは訪問前にNAVERで確認できます。' },
    moment: { en: 'Notice how the narrow lane turns away from the station road.', ja: '駅前の大通りから、小さな路地への変化を楽しもう。' },
  }),
  place({
    id: 'dior', kind: 'fashion', number: '02', name: 'Dior Seongsu', localName: '디올 성수', sign: 'DIOR',
    color: '#807961', tint: '#ece8d8', street: '연무장5길',
    address: '서울 성동구 연무장5길 7', addressEn: '7 Yeonmujang 5-gil, Seongdong-gu, Seoul',
    location: { longitude: 127.05249915, latitude: 37.54401975 }, footprintIds: ['583441839'], naverId: '1289759192',
    source: 'https://www.dior.com/fashion/stores/ko_kr/대한민국/seoul/7-yeonmujang-5-gil', sourceName: 'Dior',
    category: { en: 'Fashion boutique', ja: 'ファッションブティック' },
    note: { en: 'A fashion landmark beside the bend.', ja: '路地の曲がり角に、ファッションのランドマーク。' },
    description: { en: 'Dior’s Seongsu boutique is at 7 Yeonmujang 5-gil. The official store directory lists both women’s and men’s collections.', ja: 'ヨンムジャン5ギル7にあるディオールの聖水ブティック。公式案内にはウィメンズとメンズの取り扱いが掲載されています。' },
    detail: { en: 'Tamburins is nearby on the other side of this small junction. Follow the lane southwest to join Yeonmujang-gil.', ja: '小さな交差点の向こうにはタンバリンズ。路地を南西へたどると、ヨンムジャンギルにつながります。' },
    moment: { en: 'Look for the contrast between a pale façade and the surrounding workshops.', ja: '明るいファサードと、周囲の建物のコントラストに注目。' },
  }),
  place({
    id: 'tamburins', kind: 'fragrance', number: '03', name: 'Tamburins', localName: '탬버린즈 성수', sign: 'TAMBURINS',
    color: '#9a8057', tint: '#eee5d2', street: '연무장5길',
    address: '서울 성동구 연무장5길 8', addressEn: '8 Yeonmujang 5-gil, Seongdong-gu, Seoul',
    location: { longitude: 127.05253835, latitude: 37.5437463 }, footprintIds: ['1229858813'], naverId: '1539672429',
    source: 'https://www.tamburins.com/kr/store/korea/', sourceName: 'Tamburins',
    category: { en: 'Fragrance & beauty', ja: 'フレグランスとビューティー' },
    note: { en: 'A little detour for the senses.', ja: '香りに出会う、小さな寄り道。' },
    description: { en: 'The brand’s Seongsu store is at 8 Yeonmujang 5-gil. It is a separate location from Tamburins Haus Nowhere on Ttukseom-ro.', ja: 'ヨンムジャン5ギル8にある聖水店。トゥクソム路のハウスノーウェア店とは別の場所です。' },
    detail: { en: 'From this corner, head down to Yeonmujang-gil and follow it east toward Seongsui-ro and the two warehouse stops.', ja: 'この角からヨンムジャンギルへ。東へ歩くと、ソンスイ路沿いの2つの倉庫スポットに出会えます。' },
    moment: { en: 'The next stretch is about the street: shopfronts, side lanes, and a changing neighborhood.', ja: '次は街並みを楽しむ時間。店先や脇道を眺めながら歩こう。' },
  }),
  place({
    id: 'daelim', kind: 'coffee', number: '04', name: 'Daelim Changgo', localName: '성수동대림창고갤러리', sign: 'DAELIM CHANGGO',
    color: '#af674e', tint: '#eddfd3', street: '성수이로',
    address: '서울 성동구 성수이로 78', addressEn: '78 Seongsui-ro, Seongdong-gu, Seoul',
    location: { longitude: 127.0564591, latitude: 37.5418247 }, footprintIds: ['801819178'], naverId: '37910590',
    source: 'https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=112805', sourceName: 'VISITKOREA',
    category: { en: 'Warehouse café & gallery', ja: '倉庫カフェとギャラリー' },
    note: { en: 'Red bricks with another life.', ja: '赤いレンガに、新しい日常。' },
    description: { en: 'A café and gallery in a former rice mill. VISITKOREA traces the red-brick building to the 1970s and highlights its preserved warehouse character.', ja: 'かつての精米所を利用したカフェとギャラリー。韓国観光公社は、1970年代の赤レンガ建築と残された倉庫の雰囲気を紹介しています。' },
    detail: { en: 'This café is at number 78. The nearby MUSINSA store at number 74 is a different stop, even though both use the Daelim Changgo name.', ja: 'カフェの住所は78番。近くの74番にあるMUSINSAとは、同じ大林倉庫の名を持つ別のスポットです。' },
    moment: { en: 'Pause at the warehouse corner where Yeonmujang-gil meets Seongsui-ro.', ja: 'ヨンムジャンギルとソンスイ路が交わる、倉庫の角でひと休み。' },
  }),
  place({
    id: 'musinsa', kind: 'fashion', number: '05', name: 'MUSINSA Seongsu', localName: '무신사 스토어 성수', sign: 'MUSINSA',
    color: '#515d58', tint: '#dfe3dd', street: '성수이로',
    address: '서울 성동구 성수이로 74', addressEn: '74 Seongsui-ro, Seongdong-gu, Seoul',
    // Approximate anchor of the paired warehouse footprints, visually checked in Naver.
    location: { longitude: 127.056393, latitude: 37.54156 }, footprintIds: ['801819180', '801819181'], naverId: '1107729911',
    source: 'https://www.musinsa.com/cms/news/view/13353', sourceName: 'MUSINSA',
    category: { en: 'Fashion in a warehouse', ja: '倉庫で楽しむファッション' },
    note: { en: 'Two rooflines. A new chapter.', ja: '2つの屋根に、新しい物語。' },
    description: { en: 'MUSINSA opened its Seongsu @ Daelim Changgo store in September 2024. Its paired warehouse roofs give this fashion and sneaker store a distinctive outline.', ja: '2024年9月にオープンしたMUSINSA聖水＠大林倉庫。並んだ倉庫の屋根が印象的な、ファッションとスニーカーのストアです。' },
    detail: { en: 'This is the southern stop of our walk. Follow Seongsui-ro north to return toward Seongsu Station exit 3.', ja: 'この散歩の南側のスポット。ソンスイ路を北へ進むと、聖水駅3番出口方面へ戻れます。' },
    moment: { en: 'Look back along Seongsui-ro before opening your finished passport.', ja: 'ソンスイ路を振り返ったら、集めたパスポートを開こう。' },
  }),
];
export const placeIds = places.map((place) => place.id);
export const findPlace = (id: PlaceId): Place => places.find((place) => place.id === id)!;
