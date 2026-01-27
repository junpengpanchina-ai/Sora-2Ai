export type ExampleRatio = '9:16' | '4:5' | '16:9'

export type ExampleTag =
  | 'Social'
  | 'E-commerce'
  | 'Business'
  | 'Real estate'
  | 'Food'
  | 'Creative'

export type HeroExample = {
  id: string
  title: string
  tag: ExampleTag
  prompt: string
  ratio: ExampleRatio
  // public/ 下的静态图或 CDN URL
  thumbnail: string
}

export const HERO_EXAMPLES: HeroExample[] = [
  {
    id: 'social_pov_meme_sign',
    title: 'POV meme sign',
    tag: 'Social',
    ratio: '9:16',
    thumbnail: '/examples/social-pov-meme-sign.jpg',
    prompt:
      'Vertical smartphone video, POV-style. A young person in a cozy bedroom holds a cardboard sign with bold text: "ME TRYING AI VIDEO FOR THE FIRST TIME". They smile and react naturally, subtle handheld camera shake. Soft daylight from a window, realistic skin tones, casual hoodie. Short clip, social media vibe, natural contrast, light film grain.',
  },
  {
    id: 'ecom_skincare_hero_demo',
    title: 'Skincare demo ad',
    tag: 'E-commerce',
    ratio: '4:5',
    thumbnail: '/examples/ecom-skincare-demo.jpg',
    prompt:
      'Vertical product demo video. A premium skincare bottle on a clean white table near a window. Soft natural daylight, realistic shadows, subtle reflections on the label. Slow push-in camera movement, minimal modern background, lifestyle aesthetic. Ultra-clean, high-end ecommerce style, no heavy neon, no abstract gradients.',
  },
  {
    id: 'biz_friendly_explainer',
    title: 'Friendly explainer',
    tag: 'Business',
    ratio: '9:16',
    thumbnail: '/examples/biz-friendly-explainer.jpg',
    prompt:
      'Vertical talking-head explainer video. A friendly presenter speaking to camera with natural eye contact and subtle expressions. Background: simple home office with a warm desk lamp and bookshelf, softly blurred. Clean, even soft lighting, realistic skin tones. Modern creator-style explanation, not corporate stock footage, not robotic.',
  },
  {
    id: 're_apartment_walkthrough',
    title: 'Apartment walkthrough',
    tag: 'Real estate',
    ratio: '16:9',
    thumbnail: '/examples/re-apartment-walkthrough.jpg',
    prompt:
      'Horizontal walkthrough video of a modern apartment. Wide-angle lens feel, smooth gimbal movement, natural daylight. Start from the living room, slowly pan toward the kitchen, warm neutral colors. Realistic interior details, soft shadows, no over-cinematic grading. Feels like a real listing video shot on a phone + gimbal.',
  },
  {
    id: 'food_ramen_steam',
    title: 'Ramen steam close-up',
    tag: 'Food',
    ratio: '9:16',
    thumbnail: '/examples/food-ramen-steam.jpg',
    prompt:
      'Vertical smartphone-style food video. Close-up of ramen being stirred gently, steam rising naturally. Warm restaurant lighting, shallow depth of field, natural highlights and bokeh. Satisfying, authentic vibe, subtle handheld micro-movement. Looks like a viral short video, not a studio commercial.',
  },
  {
    id: 'creative_rainy_umbrella_scene',
    title: 'Rainy umbrella scene',
    tag: 'Creative',
    ratio: '16:9',
    thumbnail: '/examples/creative-rainy-umbrella.jpg',
    prompt:
      'Horizontal cinematic short scene. A person walks through a rainy city street holding an umbrella, reflections on wet ground. Realistic lighting, soft fog, shallow depth of field, gentle slow dolly movement. Modern film look with restrained color grading (no neon overload). Clear subject and story beat in a single frame, cinematic but still human and usable.',
  },
]

