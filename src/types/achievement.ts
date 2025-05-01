import { Timestamp } from "firebase/firestore";

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  date: Timestamp;
  photoUrl: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags: string[];
}

export interface NewAchievement {
  title: string;
  date: Date;
  photoFile: File;
  tags: string[];
}

export interface EditAchievement {
  title: string;
  date: Date;
  photoFile?: File;
  tags: string[];
}
