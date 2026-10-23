export const NAV_LINKS = [
  { label: 'The car', href: '#design' },
  { label: 'Performance', href: '#performance' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Experience', href: '#experience' },
]

export const SPECS = [
  { value: '2.9', unit: 'sec', label: '0—100 km/h' },
  { value: '340', unit: 'km/h', label: 'Top speed' },
  { value: '850', unit: 'hp', label: 'Combined output' },
  { value: 'AWD', unit: '', label: 'Torque vectoring' },
]

export const STORY_STAGES = [
  {
    id: 'structure',
    index: '01',
    label: 'The carbon cell',
    focus: 'InteriorCage',
    focusLabel: 'CARBON MONOCOQUE / OCCUPANT CELL',
    title: ['A STRONGER', 'CORE.'],
    paragraph:
      'The carbon-fibre monocoque forms the ASTRA’s structural core. It keeps the chassis light and rigid while creating a protected cell around the driver.',
    details: [
      ['Structure', 'Carbon-fibre monocoque'],
      ['Dry weight', '1,315 kg'],
      ['Purpose', 'Strength with minimal mass'],
    ],
    side: 'left',
  },
  {
    id: 'aerodynamics',
    index: '02',
    label: 'Underbody aerodynamics',
    focus: 'BodyUnderside',
    focusLabel: 'VENTURI UNDERFLOOR / AIRFLOW PATH',
    title: ['AIR,', 'MADE USEFUL.'],
    paragraph:
      'Shaped channels under the floor accelerate the air beneath the car. That pressure difference helps hold the ASTRA to the road at speed, while the active rear wing balances the load.',
    details: [
      ['Drag coefficient', '0.27 Cd'],
      ['Downforce', '420 kg at 250 km/h'],
      ['Aero mode', 'Active rear wing'],
    ],
    side: 'right',
  },
  {
    id: 'brakes',
    index: '03',
    label: 'Forged wheel & brake',
    focus: 'WheelFrontRBrakeDisc',
    focusLabel: 'CARBON-CERAMIC DISC / FRONT RIGHT',
    title: ['CONTROL,', 'AT EVERY CORNER.'],
    paragraph:
      'Lightweight forged wheels reduce unsprung mass. Behind them, large carbon-ceramic discs and multi-piston calipers turn speed into repeatable stopping force.',
    details: [
      ['Front disc', '410 mm carbon-ceramic'],
      ['Rear disc', '390 mm carbon-ceramic'],
      ['Benefit', 'Consistent braking under load'],
    ],
    side: 'left',
  },
  {
    id: 'powertrain',
    index: '04',
    label: 'Hybrid V8 powertrain',
    focus: 'Engine',
    focusLabel: 'TWIN-TURBO V8 / HYBRID ASSIST',
    title: ['POWER,', 'DELIVERED.'],
    paragraph:
      'A twin-turbocharged 4.0-litre V8 works with hybrid assistance and an eight-speed dual-clutch transmission. All-wheel torque vectoring puts the output down cleanly on the way out of a corner.',
    details: [
      ['Combined output', '850 hp'],
      ['Transmission', '8-speed dual-clutch'],
      ['Drive', 'All-wheel torque vectoring'],
    ],
    side: 'right',
  },
  {
    id: 'lights',
    index: '05',
    label: 'Light signature',
    focus: 'BodyTaillights',
    focusLabel: 'REAR LED BLADE / LIGHT SIGNATURE',
    title: ['A SIGNATURE', 'IN LIGHT.'],
    paragraph:
      'A full-width rear light blade makes the ASTRA recognisable from a distance. Its clear, continuous signature also helps following drivers read the car’s width and braking intent.',
    details: [
      ['Rear', 'Continuous LED light blade'],
      ['Front', 'Precision LED headlamps'],
      ['Purpose', 'Visibility and recognition'],
    ],
    side: 'left',
  },
  {
    id: 'apex',
    index: '06',
    label: 'The ASTRA / 001',
    title: ['EVERY PART,', 'IN ITS PLACE.'],
    paragraph:
      'Structure, airflow, power and control work as one system. Keep scrolling to explore the full vehicle, or arrange a private viewing of the ASTRA / 001.',
    details: [],
    side: 'center',
    final: true,
  },
]

export const DESIGN_FEATURES = [
  {
    index: '01',
    title: 'A single gesture',
    copy: 'From the low nose to the muscular haunch, the body reads as one unbroken surface. Nothing added without reason.',
  },
  {
    index: '02',
    title: 'Carbon, made visible',
    copy: 'The exposed monocoque is not a trim detail. It is the architecture — rigid, exact, and finished by hand.',
  },
  {
    index: '03',
    title: 'Light as material',
    copy: 'A continuous blade of LED light signs the front and rear, giving the ASTRA a presence before it arrives.',
  },
]

export const PERFORMANCE_STATS = [
  { value: '2.9', unit: 's', label: '0—100 km/h' },
  { value: '340', unit: 'km/h', label: 'Top speed' },
  { value: '850', unit: 'hp', label: 'Combined output' },
  { value: '850', unit: 'Nm', label: 'Peak torque' },
]

export const PERFORMANCE_ROWS = [
  ['Powertrain', '4.0L twin-turbo V8 / hybrid'],
  ['Power-to-weight', '646 hp per tonne'],
  ['Transmission', '8-speed dual-clutch'],
  ['Brakes', 'Carbon-ceramic, 410 / 390 mm'],
  ['Tyres', 'Apex-spec Michelin Pilot Sport Cup 2'],
  ['Drive', 'All-wheel with torque vectoring'],
]

export const GALLERY = [
  {
    src: '/images/astra-side.jpg',
    alt: 'APEX Astra concept car in profile in a dark studio, lit by cool-white studio light',
    label: '01 / Profile',
    caption: 'A single line from nose to tail.',
    className: 'gallery-card--wide',
  },
  {
    src: '/images/astra-front.jpg',
    alt: 'Front three-quarter view of the British racing green APEX Astra concept car',
    label: '02 / Presence',
    caption: 'The face before the sound.',
    className: 'gallery-card--tall',
  },
  {
    src: '/images/astra-rear.jpg',
    alt: 'Rear three-quarter view of the APEX Astra concept car showing its full-width light blade',
    label: '03 / Signature',
    caption: 'A light that lingers.',
    className: 'gallery-card--standard',
  },
  {
    src: '/images/astra-detail.jpg',
    alt: 'Close view of the APEX Astra wheel, green brake caliper, and sculpted bodywork',
    label: '04 / Detail',
    caption: 'Held to the last millimetre.',
    className: 'gallery-card--standard',
  },
]

export const VIEWER_VIEWS = [
  { id: 'front', label: 'Front' },
  { id: 'profile', label: 'Profile' },
  { id: 'rear', label: 'Rear' },
  { id: 'home', label: 'Three-quarter' },
]
