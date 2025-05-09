import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
  Firestore,
  DocumentReference,
  collection,
  addDoc,
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, User } from "firebase/auth";
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
  StorageReference,
} from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  getDatabase,
  ref as dbRef,
  set as dbSet,
  get as dbGet,
  DataSnapshot,
} from "firebase/database";
import {
  getAnalytics,
  logEvent,
  Analytics,
  isSupported,
} from "firebase/analytics";
import {
  clearFirestoreData,
} from "@firebase/rules-unit-testing";
import {
  firebaseApp,
  firestore,
  storage,
  functions,
  analytics,
  realtimeDb,
  auth,
  getDocument,
  setDocument,
  uploadFile,
  getFileDownloadURL,
  callFunction,
  setRealtimeDbData,
  getRealtimeDbData,
  logAnalyticsEvent,
} from "./firebase";

let testEnv: RulesTestEnvironment;
let db: Firestore;
let testStorage: ReturnType<typeof getStorage>;
let testFunctions: ReturnType<typeof getFunctions>;
let testAuth: ReturnType<typeof getAuth>;
let testAnalytics: Analytics;
let testRealtimeDb: ReturnType<typeof getDatabase>;

const projectId = "your-project-id";

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: "localhost",
      port: 8080,
    },
    storage: {
      host: "localhost",
      port: 9199,
    },
    functions: {
      host: "localhost",
      port: 5001,
    },
    database: {
      host: "localhost",
      port: 9000,
    },
  });
  db = getFirestore(testEnv.app());
  testStorage = getStorage(testEnv.app());
  testFunctions = getFunctions(testEnv.app());
  testAuth = getAuth(testEnv.app());
  testAnalytics = getAnalytics(testEnv.app());
  testRealtimeDb = getDatabase(testEnv.app());
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe("Firebase Interactions", () => {
  describe("Firestore", () => {
    it("should set and get a document", async () => {
      const data = { test: "data" };
      await setDocument(db, "testCollection", "testDoc", data);
      const fetchedData = await getDocument(db, "testCollection", "testDoc");
      expect(fetchedData).toEqual(data);
    });

    it("should handle errors when setting a document", async () => {
      await expect(
        setDocument(db, "", "testDoc", { test: "data" })
      ).rejects.toThrow();
    });

    it("should handle errors when getting a document", async () => {
      await expect(getDocument(db, "testCollection", "")).rejects.toThrow();
    });
  });

  describe("Storage", () => {
    it("should upload a file and get its download URL", async () => {
      const testString = "Test string";
      const testFileRef = ref(testStorage, "testFile.txt");
      await uploadFile(testStorage, testFileRef, testString);
      const url = await getFileDownloadURL(testStorage, testFileRef);
      expect(url).toContain("testFile.txt");
    });

    it("should handle errors when uploading a file", async () => {
      await expect(uploadFile(testStorage, null, "test")).rejects.toThrow();
    });

    it("should handle errors when getting a download URL", async () => {
      await expect(
        getFileDownloadURL(testStorage, null)
      ).rejects.toThrow();
    });
  });

  describe("Cloud Functions", () => {
    it("should call a function", async () => {
      const functionName = "testFunction";
      const mockCallable = jest.fn();
      const functionsEmulator = {
        httpsCallable: (name) => {
          if (name === functionName) {
            return mockCallable;
          }
        },
      };
      mockCallable.mockResolvedValue({ data: "success" });

      await callFunction(functionsEmulator as any, functionName, {
        input: "test",
      });
      expect(mockCallable).toHaveBeenCalledWith({ input: "test" });
    });

    it("should handle errors when calling a function", async () => {
      const functionName = "testFunction";
      const mockCallable = jest.fn();
      const functionsEmulator = {
        httpsCallable: (name) => {
          if (name === functionName) {
            return mockCallable;
          }
        },
      };
      mockCallable.mockRejectedValue(new Error("test"));

      await expect(
        callFunction(functionsEmulator as any, functionName, { input: "test" })
      ).rejects.toThrow();
      expect(mockCallable).toHaveBeenCalledWith({ input: "test" });
    });
  });

  describe("Realtime Database", () => {
    it("should set and get data in Realtime Database", async () => {
      const testPath = "testPath";
      const testData = { key: "value" };
      await setRealtimeDbData(testRealtimeDb, testPath, testData);
      const data = await getRealtimeDbData(testRealtimeDb, testPath);
      expect(data).toEqual(testData);
    });
    it("should handle errors when setting data", async () => {
      await expect(setRealtimeDbData(testRealtimeDb, null, {})).rejects.toThrow();
    });
    it("should handle errors when getting data", async () => {
      await expect(getRealtimeDbData(testRealtimeDb, null)).rejects.toThrow();
    });
  });

  describe("Analytics", () => {
    it("should log an analytics event", async () => {
      const isAnalyticsSupported = await isSupported();

      if (isAnalyticsSupported) {
        const eventName = "test_event";
        const eventParams = { test: "param" };
        await logAnalyticsEvent(testAnalytics, eventName, eventParams);
      }
    });
  });
});