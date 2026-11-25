// The LEED 26 crew (AJK): everyone who filled in the lanyard and PVC card form, plus Haziq Farhan.
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
  { id: "umairah", name: "Umairah", fullName: "Umairah binti Ahmad Tarmizi", role: "Crew", committee: "Judging and Evaluation", kind: "student" },
  { id: "natasha", name: "Natasha", fullName: "Nurulain Natasha binti Kamaruzaman", role: "Crew", committee: "Judging and Evaluation", kind: "student" },
  { id: "dr-amalina", name: "Dr Amalina", fullName: "Dr Amalina", role: "Staff", committee: TO_CONFIRM, kind: "staff" }, // card not received yet
];

export const KIND_LABEL: Record<CrewKind, string> = { student: 'AJK Student', staff: 'AJK Staff' };

export function frontOf(c: CrewMember): string {
  return c.hasCard ? `/cards/${c.id}.jpg` : PLACEHOLDER_FRONT;
}

export function findCrew(id: string): CrewMember | undefined {
  return CREW.find((c) => c.id === id);
}
