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
    id: 'hood',
    index: '02',
    label: 'Hood & front end',
    focus: 'BodyHood',
    focusLabel: 'SCULPTED HOOD / FRONT AERODYNAMIC SURFACES',
    title: ['FORM,', 'UNDER PRESSURE.'],
    paragraph:
      'The hood is shaped as one continuous surface, falling toward the low nose. A close view reveals the creases, headlamp edges, and layered front aero that set the ASTRA’s stance.',
    details: [
      ['Focus', 'Hood and front bodywork'],
      ['Lighting', 'Integrated headlamp assemblies'],
      ['Surface', 'Deep metallic British racing green'],
    ],
    side: 'left',
  },
  {
    id: 'upper-body',
    index: '03',
    label: 'Glass & upper body',
    focus: 'BodyWindshield',
    focusLabel: 'WINDSCREEN / ROOFLINE / HAND-FINISHED GLASS',
    title: ['LIGHT,', 'HELD IN GLASS.'],
    paragraph:
      'The windscreen sweeps into the roof and side glass in a single arc. Reflections track the changing curvature, while the cabin remains visible beneath the canopy.',
    details: [
      ['View', 'Elevated front three-quarter'],
      ['Glass', 'Windshield and side glazing'],
      ['Inside', 'Cockpit visible through the canopy'],
    ],
    side: 'right',
  },
  {
    id: 'front-three-quarter',
    index: '04',
    label: 'Low-angle study',
    focus: 'BodyUnderside',
    focusLabel: 'LOW NOSE / FRONT ARCH / UNDERBODY',
    title: ['ENGINEERED', 'WITHOUT COMPROMISE.'],
    paragraph:
      'A low camera puts the nose, wheel arches, and underbody on the same horizon. The full silhouette stays grounded while the studio light travels across the body.',
    details: [
      ['View', 'Front three-quarter'],
      ['Ride height', 'Low-set performance stance'],
      ['Material', 'Painted body panels and glass'],
    ],
    side: 'center',
  },
  {
    id: 'front-wheel',
    index: '05',
    label: 'Wheel & brake detail',
    focus: 'WheelFrontRBrakeDisc',
    focusLabel: 'FRONT BRAKE DISC / CALIPER / FORGED RIM',
    title: ['CONTROL,', 'AT EVERY CORNER.'],
    paragraph:
      'The model’s front wheel assembly exposes the rim, tire, brake disc, and caliper in one view. The camera closes in on the hardware that meets the road.',
    details: [
      ['Assembly', 'Front right wheel and brake'],
      ['Visible parts', 'Rim, tire, disc, caliper'],
      ['Focus', 'Unsprung hardware'],
    ],
    side: 'left',
  },
  {
    id: 'dark-silhouette',
    index: '06',
    label: 'Midnight studio',
    focusLabel: 'RIM LIGHT / SIDE PROFILE / REFLECTIVE FLOOR',
    title: ['A SHAPE', 'IN THE DARK.'],
    paragraph:
      'The studio falls to charcoal and midnight blue. Narrow strips of light reveal the roofline, doors, and rear haunches without losing the identity of the same car.',
    details: [
      ['Environment', 'Charcoal and midnight blue'],
      ['Lighting', 'Controlled studio rim light'],
      ['View', 'Side profile'],
    ],
    side: 'right',
  },
  {
    id: 'rear-wheel',
    index: '07',
    label: 'Rear quarter',
    focus: 'WheelRearRRim',
    focusLabel: 'REAR WHEEL / REAR BODYWORK / LIGHT BLADE',
    title: ['POWER,', 'PUT TO THE ROAD.'],
    paragraph:
      'The camera rounds the rear quarter and settles beside the rear wheel. The actual model includes the rear rim, tire, brake hardware, body panels, and illuminated tail signature.',
    details: [
      ['View', 'Rear three-quarter close-up'],
      ['Visible parts', 'Wheel, tire, brake and tail lamps'],
      ['Composition', 'Rear haunch and bodywork'],
    ],
    side: 'left',
  },
  {
    id: 'cockpit',
    index: '08',
    label: 'Cockpit & canopy',
    focus: 'InteriorSeatsColor1',
    focusLabel: 'STEERING WHEEL / DASHBOARD / SEAT FORMS',
    title: ['BUILT', 'AROUND THE DRIVER.'],
    paragraph:
      'Through the windscreen, the model reveals its steering wheel, dashboard, and seats. The camera follows the canopy line before looking into the real cockpit geometry.',
    details: [
      ['View', 'Through the front windscreen'],
      ['Visible parts', 'Steering wheel, dash, seats'],
      ['Architecture', 'Driver-first cockpit'],
    ],
    side: 'right',
  },
  {
    id: 'driving',
    index: '09',
    label: 'The road ahead',
    title: ['THE ROAD IS', 'ONLY THE BEGINNING.'],
    paragraph:
      'The ASTRA leaves the studio for a final real-time road sequence. Follow the same sculpted form into motion, then arrange a private viewing of the ASTRA / 001.',
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
