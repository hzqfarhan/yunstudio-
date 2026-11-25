// The LEED 26 crew (AJK): the students who filled in the lanyard and PVC card form, plus Haziq Farhan,
// and the AJK staff from the STAFFCARD folder.
// Names, roles and committees are as printed on their cards (STUDENTCCARD.pdf).
//
// To add someone:
//   1. Export the front of their card from Canva at 1020 x 1503 px (9.5 : 14) and save it as
//      public/cards/<id>.jpg, where <id> is the id below (qaid-uqail).
//   2. Add a line below. `kind` is 'student' for AJK students and 'staff' for AJK staff.
//   3. Their own page is then /pass/<id>. Send them that link.
//
// Until public/cards/<id>.jpg exists for someone, set `hasCard: false` (or leave it out) and the
// studio shows a "card coming soon" front for them. Set it to true once the file is in place.
// Every pass uses the same back (public/card/back.jpg) unless `back` is set.

export type CrewKind = 'student' | 'staff';

export interface CrewMember {
  id: string;
  /** Name as printed on the card. */
  name: string;
  /** Full name from the form, used for search. */
  fullName: string;
  /** Position as printed on the card: Director, Treasurer, Leader, Crew ... */
  role: string;
  /** Committee (unit), without the "AJK" prefix. */
  committee: string;
  kind: CrewKind;
  /** True once public/cards/<id>.jpg is in place. */
  hasCard?: boolean;
  /** Has not filled in the lanyard and PVC card form yet: shown greyed out with no card design, and no pass page.
   *  Their card image is kept in cards-pending/ (outside public/) until they submit. */
  pending?: boolean;
  back?: string;
}

export const DEFAULT_BACK = '/card/back.jpg';
export const PLACEHOLDER_FRONT = '/card/coming-soon.jpg';
/** Committee not readable on the card yet; confirm and replace. */
const TO_CONFIRM = 'To be confirmed';

export const CREW: CrewMember[] = [
  { id: "haziq-farhan", name: "Haziq Farhan", fullName: "Haziq Farhan", role: "Director", committee: "High Committee", kind: "student", hasCard: true },
  { id: "qaid-uqail", name: "Qaid Uqail", fullName: "Muhammad Qaid Uqail bin Khairul Anuar", role: "Treasurer", committee: "High Committee", kind: "student", hasCard: true },
  { id: "qurratul-ain", name: "Qurratul Ain", fullName: "Nur Qurratul Ain binti Norhasrizal", role: "Leader", committee: "Protocol and Reception", kind: "student", hasCard: true },
  { id: "aisya-sofea", name: "Aisya Sofea", fullName: "Nur Aisya Sofea binti Shahrul Amer", role: "Crew", committee: "Protocol and Reception", kind: "student", hasCard: true },
  { id: "arinah-husna", name: "Arinah Husna", fullName: "Arinah Husna binti Mohd Noor", role: "Crew", committee: "Protocol and Reception", kind: "student", hasCard: true },
  { id: "nurathirah", name: "Nurathirah", fullName: "Siti Nurathirah Alyaa binti Sabarudin", role: "Crew", committee: "Protocol and Reception", kind: "student", hasCard: true },
  { id: "aniesa-safia", name: "Aniesa Safia", fullName: "Siti Nur Aniesa Safia binti Mohamad Azwan", role: "Crew", committee: "Protocol and Reception", kind: "student", hasCard: true },
  { id: "nur-najwa", name: "Nur Najwa", fullName: "Nur Najwa binti Nazri", role: "Crew", committee: "Protocol and Reception", kind: "student", hasCard: true },
  { id: "hannan-batrisyia", name: "Hannan Batrisyia", fullName: "Hannan Batrisyia binti Ghazali", role: "Crew", committee: "Marketing and Promotion", kind: "student", hasCard: true },
  { id: "faiqah-dayana", name: "Faiqah Dayana", fullName: "Nur Faiqah Dayana binti Siswan Nizam", role: "Crew", committee: "Marketing and Promotion", kind: "student", hasCard: true },
  { id: "syamimi-aqilah", name: "Syamimi Aqilah", fullName: "Nur Syamimi Aqilah bt Zuhaini", role: "Crew", committee: "Marketing and Promotion", kind: "student", hasCard: true },
  { id: "solihin", name: "Solihin", fullName: "Muhammad Solihin bin Abdul Rahim", role: "Crew", committee: "Marketing and Promotion", kind: "student", hasCard: true },
  { id: "danish-haiqal", name: "Danish Haiqal", fullName: "Danish Haiqal bin Shahrel Anuar", role: "Crew", committee: "Marketing and Promotion", kind: "student", hasCard: true },
  { id: "amar-danish", name: "Amar Danish", fullName: "Muhammad Amar Danish bin Azizan", role: "Leader", committee: "3K", kind: "student", hasCard: true },
  { id: "imran-syahmi", name: "Imran Syahmi", fullName: "Imran Syahmi bin Putera", role: "Crew", committee: "3K", kind: "student", hasCard: true },
  { id: "afiq-amin", name: "Afiq Amin", fullName: "Muhammad Afiq Amin bin Jali", role: "Crew", committee: "3K", kind: "student", hasCard: true },
  { id: "amir-syahir", name: "Amir Syahir", fullName: "Amir Syahir", role: "Crew", committee: "3K", kind: "student", hasCard: true },
  { id: "alia-solehah", name: "Alia Solehah", fullName: "Alia Solehah binti Aidil Aznim", role: "Crew", committee: "3K", kind: "student", hasCard: true },
  { id: "ng-zhi-wei", name: "Ng Zhi Wei", fullName: "Ng Zhi Wei", role: "Leader", committee: "Technical and Logistics", kind: "student", hasCard: true },
  { id: "naim-farhan", name: "Naim Farhan", fullName: "Muhammad Na’im Farhan bin Rusli", role: "Crew", committee: "Technical and Logistics", kind: "student", hasCard: true },
  { id: "imran-naufal", name: "Imran Naufal", fullName: "Muhammad Imran Naufal bin Hirwan", role: "Crew", committee: "Technical and Logistics", kind: "student", hasCard: true },
  { id: "danish", name: "Danish", fullName: "Muhammad Danish bin Mohd Aris", role: "Crew", committee: "Technical and Logistics", kind: "student", hasCard: true },
  { id: "harith-arshad", name: "Harith Arshad", fullName: "Muhammad Harith Arshad bin Mohd Kamal", role: "Crew", committee: "Technical and Logistics", kind: "student", hasCard: true },
  { id: "nur-sakinah", name: "Nur Sakinah", fullName: "Nur Sakinah binti Sabri", role: "Crew", committee: "Food and Refreshments", kind: "student", hasCard: true },
  { id: "haifa-batrisyia", name: "Haifa Batrisyia", fullName: "Haifa Batrisyia binti Mohd Rapi", role: "Crew", committee: "Food and Refreshments", kind: "student", hasCard: true },
  { id: "danial", name: "Danial", fullName: "Muhammad Danial bin Shaharuddin", role: "Crew", committee: "Gifts and Souvenirs", kind: "student", hasCard: true },
  { id: "azmeer", name: "Azmeer", fullName: "Muhammad Noor Azmeer bin Abdul Halim", role: "Crew", committee: "Gifts and Souvenirs", kind: "student", hasCard: true },
  { id: "syaaban-bux", name: "Syaaban Bux", fullName: "Muhammad Syaaban Bux bin Rahman Bux", role: "Crew", committee: "Gifts and Souvenirs", kind: "student", hasCard: true },
  { id: "nurul-yasmin", name: "Nurul Yasmin", fullName: "Nurul Yasmin binti Mohammad Fahri", role: "Leader", committee: "Judging and Evaluation", kind: "student", hasCard: true },
  { id: "norsyafarihan", name: "Norsyafarihan", fullName: "Norsyafarihan binti Rosli", role: "Crew", committee: "Judging and Evaluation", kind: "student", hasCard: true },
  { id: "umairah", name: "Umairah", fullName: "Umairah binti Ahmad Tarmizi", role: "Crew", committee: "Judging and Evaluation", kind: "student", hasCard: true },
  { id: "natasha", name: "Natasha", fullName: "Nurulain Natasha binti Kamaruzaman", role: "Crew", committee: "Judging and Evaluation", kind: "student", hasCard: true },
  // Students with a card who have not filled in the form yet (shown greyed out)
  { id: "ariff-danial", name: "Ariff Danial", fullName: "Ariff Danial", role: "Deputy Director", committee: "High Committee", kind: "student", hasCard: true, pending: true },
  { id: "farhah-ain", name: "Farhah Ain", fullName: "Farhah Ain", role: "Secretary", committee: "High Committee", kind: "student", hasCard: true, pending: true },
  { id: "muqri-ibad", name: "Muqri Ibad", fullName: "Muqri Ibad", role: "Leader", committee: "Stall Management", kind: "student", hasCard: true, pending: true },
  { id: "danish-aiman", name: "Danish Aiman", fullName: "Danish Aiman", role: "Crew", committee: "Stall Management", kind: "student", hasCard: true, pending: true },
  { id: "firas-uqail", name: "Firas Uqail", fullName: "Firas Uqail", role: "Crew", committee: "Stall Management", kind: "student", hasCard: true, pending: true },
  { id: "sudhirman", name: "Sudhirman", fullName: "Sudhirman", role: "Crew", committee: "Stall Management", kind: "student", hasCard: true, pending: true },
  { id: "nur-khadijah", name: "Nur Khadijah", fullName: "Nur Khadijah", role: "Leader", committee: "Food and Refreshments", kind: "student", hasCard: true, pending: true },
    // AJK Staff (STAFFCARD folder). Only Dr Amalina has filled in the form so far; the rest are pending.
  { id: "prof-mohd-farhan", name: "Prof Ts Dr Mohd Farhan", fullName: "Prof Ts Dr Mohd Farhan", role: "Patron", committee: "High Committee", kind: "staff", hasCard: true, pending: true },
  { id: "dr-muhammad-nazim", name: "Dr Muhammad Nazim", fullName: "Dr Muhammad Nazim", role: "Director", committee: "High Committee", kind: "staff", hasCard: true, pending: true },
  { id: "pm-dr-muhaini", name: "PM Dr Muhaini", fullName: "PM Dr Muhaini", role: "Deputy Director", committee: "High Committee", kind: "staff", hasCard: true, pending: true },
  { id: "en-mohd-haziq-asyraff", name: "En Mohd Haziq Asyraff", fullName: "En Mohd Haziq Asyraff", role: "Secretary", committee: "High Committee", kind: "staff", hasCard: true, pending: true },
  { id: "pn-noris", name: "Pn Noris", fullName: "Pn Noris", role: "Assistant Secretary", committee: "High Committee", kind: "staff", hasCard: true, pending: true },
  { id: "en-mohammad-hafiz", name: "En Mohammad Hafiz", fullName: "En Mohammad Hafiz", role: "Advisory Crew", committee: "Technical and Logistics", kind: "staff", hasCard: true, pending: true },
  { id: "en-shahidan", name: "En Shahidan", fullName: "En Shahidan", role: "Advisory Crew", committee: "Technical and Logistics", kind: "staff", hasCard: true, pending: true },
  { id: "dr-nur-ziadah", name: "Dr Nur Ziadah", fullName: "Dr Nur Ziadah", role: "Advisory Crew", committee: "Judging and Evaluation", kind: "staff", hasCard: true, pending: true },
  { id: "dr-ezak-fadzrin", name: "Dr Ezak Fadzrin", fullName: "Dr Ezak Fadzrin", role: "Advisory Crew", committee: "Judging and Evaluation", kind: "staff", hasCard: true, pending: true },
  { id: "pm-ts-dr-mohd-amin", name: "PM Ts Dr Mohd Amin", fullName: "PM Ts Dr Mohd Amin", role: "Advisory Crew", committee: "Judging and Evaluation", kind: "staff", hasCard: true, pending: true },
  { id: "ts-dr-deden-witarsyah", name: "Ts Dr Deden Witarsyah", fullName: "Ts Dr Deden Witarsyah", role: "Advisory Crew", committee: "Judging and Evaluation", kind: "staff", hasCard: true, pending: true },
  { id: "pn-suriawati", name: "Pn Suriawati", fullName: "Pn Suriawati", role: "Advisory Crew", committee: "Stall Management", kind: "staff", hasCard: true, pending: true },
  { id: "cik-siti-haslinda", name: "Cik Siti Haslinda", fullName: "Cik Siti Haslinda", role: "Advisory Crew", committee: "Stall Management", kind: "staff", hasCard: true, pending: true },
  { id: "dr-shahdatunnaim", name: "Dr Shahdatunnaim", fullName: "Dr Shahdatunnaim", role: "Advisory Crew", committee: "Marketing and Promotion", kind: "staff", hasCard: true, pending: true },
  { id: "dr-amalina", name: "Dr Nor Amalina", fullName: "Dr Nor Amalina", role: "Advisory Crew", committee: "Marketing and Promotion", kind: "staff", hasCard: true },
  { id: "dr-muhammad-shukri", name: "Dr Muhammad Shukri", fullName: "Dr Muhammad Shukri", role: "Advisory Crew", committee: "3K", kind: "staff", hasCard: true, pending: true },
  { id: "en-mohd-kamarul-azhar", name: "En Mohd Kamarul Azhar", fullName: "En Mohd Kamarul Azhar", role: "Advisory Crew", committee: "3K", kind: "staff", hasCard: true, pending: true },
];

export const KIND_LABEL: Record<CrewKind, string> = { student: 'AJK Student', staff: 'AJK Staff' };

export function frontOf(c: CrewMember): string {
  return c.hasCard ? `/cards/${c.id}.jpg` : PLACEHOLDER_FRONT;
}

export function findCrew(id: string): CrewMember | undefined {
  return CREW.find((c) => c.id === id && !c.pending);
}
