// src/tests/App.test.tsx
import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";

// Mock Firebase modules so they don't execute Node-incompatible code
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock("../firebaseConfig", () => ({}));

test("renders App without crashing", () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
});
