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
    id: 'exploded',
    index: '02',
    label: 'Exploded view',
    focusLabel: 'BUMPER / HOOD / DOORS / ROOF / REAR CLAMSHELL',
    title: ['TAKEN APART,', 'PIECE BY PIECE.'],
    paragraph:
      'The front bumper leaves first, then the hood, the dihedral doors, the roof and the rear clamshell. Every panel lifts clear of the carbon cell and holds in place, so you can see how the car is put together.',
    details: [
      ['Sequence', 'Bumper / hood / doors / roof / rear'],
      ['Core', 'Carbon-fibre MonoCage'],
      ['View', 'Live 3D, real panel geometry'],
    ],
    side: 'left',
  },
  {
    id: 'xray',
    index: '03',
    label: 'X-ray',
    focusLabel: 'MONOCAGE / POWERTRAIN / SUSPENSION / BRAKES',
    title: ['SEE THROUGH', 'THE SURFACE.'],
    paragraph:
      'The bodywork fades to glass while a scan passes from nose to tail. The structure underneath lights up one system at a time, then the paint returns before the next scene.',
    details: [
      ['Structure', 'Carbon tub and roof'],
      ['Power', 'Mid-mounted twin-turbo V8 hybrid'],
      ['Chassis', 'Wishbones and carbon-ceramic brakes'],
    ],
    side: 'right',
  },
  {
    id: 'wheel',
    index: '04',
    label: 'Wheel assembly',
    focusLabel: 'RIM / DISC / CALIPER / WISHBONES',
    title: ['CONTROL,', 'AT EVERY CORNER.'],
    paragraph:
      'The front-left corner comes towards you. The rim and tyre slide off the hub to show the carbon-ceramic disc, the caliper and the wishbones behind them. Keep scrolling and it all goes back together.',
    details: [
      ['Corner', 'Front left'],
      ['Visible parts', 'Rim, tyre, disc, caliper, arms'],
      ['Spring', 'Coil-over damper'],
    ],
    side: 'left',
  },
  {
    id: 'carbon',
    index: '05',
    label: 'Carbon chamber',
    focusLabel: 'CARBON TWILL / LIGHT BLADES / REFLECTIVE FLOOR',
    title: ['A SHAPE', 'IN THE DARK.'],
    paragraph:
      'The white studio gives way to a room lined in carbon twill. Narrow light bars sweep over the paint, and the floor reflects the car back at itself.',
    details: [],
    side: 'center',
  },
  {
    id: 'cockpit',
    index: '06',
    label: 'Cockpit entry',
    focusLabel: 'WINDSCREEN / DRIVER SEAT / INSTRUMENTS',
    title: ['BUILT', 'AROUND THE DRIVER.'],
    paragraph:
      'The camera rises over the nose, passes through the windscreen and settles in the driver’s seat. The instruments start up and the cabin lights come on around you.',
    details: [
      ['Entry', 'Through the windscreen'],
      ['Seat', 'Driver’s eye line'],
      ['Displays', 'Start-up sequence'],
    ],
    side: 'left',
  },
  {
    id: 'circuit',
    index: '07',
    label: 'The circuit',
    title: ['THE CIRCUIT IS', 'ONLY THE BEGINNING.'],
    paragraph:
      'Out of the studio and onto the circuit at dusk, under floodlights. Then arrange a private viewing.',
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
    alt: 'Close view of the APEX Astra wheel, orange brake caliper, and sculpted bodywork',
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
