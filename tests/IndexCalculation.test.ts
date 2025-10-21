import { describe, it, expect, beforeEach } from "vitest";
import { stringAsciiCV, uintCV, principalCV, tupleCV, optionalCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_SCORE = 101;
const ERR_INVALID_COUNTRY = 102;
const ERR_INVALID_WEIGHT = 103;
const ERR_DATA_NOT_FOUND = 104;
const ERR_INVALID_CALC_METHOD = 110;

interface Index {
  score: number;
  lastUpdated: number;
  submissionCount: number;
  briberyWeight: number;
  transparencyWeight: number;
  auditWeight: number;
}

interface Submission {
  country: string;
  briberyScore: number;
  transparencyScore: number;
  auditScore: number;
  timestamp: number;
  submitter: string;
}

interface Verification {
  verifierCount: number;
  approved: boolean;
  timestamp: number;
}

class IndexCalculationMock {
  state: {
    indexVersion: number;
    authorityContract: string | null;
    calcMethod: string;
    countryIndices: Map<string, Index>;
    dataSubmissions: Map<number, Submission>;
    submissionVerifications: Map<number, Verification>;
    nextSubmissionId: number;
    briberyWeight: number;
    transparencyWeight: number;
    auditWeight: number;
  } = {
    indexVersion: 1,
    authorityContract: null,
    calcMethod: "weighted-average",
    countryIndices: new Map(),
    dataSubmissions: new Map(),
    submissionVerifications: new Map(),
    nextSubmissionId: 0,
    briberyWeight: 40,
    transparencyWeight: 30,
    auditWeight: 30,
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  authorities: Set<string> = new Set(["ST1TEST"]);

  constructor() {
    this.reset();
  }

  reset(): void {
    this.state = {
      indexVersion: 1,
      authorityContract: null,
      calcMethod: "weighted-average",
      countryIndices: new Map(),
      dataSubmissions: new Map(),
      submissionVerifications: new Map(),
      nextSubmissionId: 0,
      briberyWeight: 40,
      transparencyWeight: 30,
      auditWeight: 30,
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.authorities = new Set(["ST1TEST"]);
  }

  setAuthorityContract(principal: string): { ok: boolean; value: boolean } {
    if (principal === "SP000000000000000000002Q6VF78") return { ok: false, value: false };
    if (this.state.authorityContract !== null) return { ok: false, value: false };
    this.state.authorityContract = principal;
    return { ok: true, value: true };
  }

  setWeights(bribery: number, transparency: number, audit: number): { ok: boolean; value: boolean } {
    if (!this.state.authorityContract) return { ok: false, value: false };
    if (bribery + transparency + audit !== 100) return { ok: false, value: false };
    this.state.briberyWeight = bribery;
    this.state.transparencyWeight = transparency;
    this.state.auditWeight = audit;
    return { ok: true, value: true };
  }

  setCalcMethod(method: string): { ok: boolean; value: boolean } {
    if (!this.state.authorityContract) return { ok: false, value: false };
    if (!["weighted-average", "simple-average"].includes(method)) return { ok: false, value: ERR_INVALID_CALC_METHOD };
    this.state.calcMethod = method;
    return { ok: true, value: true };
  }

  submitData(country: string, briberyScore: number, transparencyScore: number, auditScore: number): { ok: boolean; value: number } {
    if (country.length === 0 || country.length > 3) return { ok: false, value: ERR_INVALID_COUNTRY };
    if (briberyScore > 100 || transparencyScore > 100 || auditScore > 100) return { ok: false, value: ERR_INVALID_SCORE };
    const id = this.state.nextSubmissionId;
    this.state.dataSubmissions.set(id, { country, briberyScore, transparencyScore, auditScore, timestamp: this.blockHeight, submitter: this.caller });
    this.state.submissionVerifications.set(id, { verifierCount: 0, approved: false, timestamp: this.blockHeight });
    this.state.nextSubmissionId++;
    return { ok: true, value: id };
  }

  verifySubmission(id: number): { ok: boolean; value: boolean } {
    const submission = this.state.dataSubmissions.get(id);
    const verification = this.state.submissionVerifications.get(id);
    if (!submission || !verification) return { ok: false, value: ERR_DATA_NOT_FOUND };
    if (!this.authorities.has(this.caller)) return { ok: false, value: ERR_NOT_AUTHORIZED };
    const newCount = verification.verifierCount + 1;
    const approved = newCount >= 3;
    this.state.submissionVerifications.set(id, { verifierCount: newCount, approved, timestamp: this.blockHeight });
    if (approved) {
      this.updateIndex(submission.country, submission.briberyScore, submission.transparencyScore, submission.auditScore);
    }
    return { ok: true, value: true };
  }

  updateIndex(country: string, briberyScore: number, transparencyScore: number, auditScore: number): { ok: boolean; value: number } {
    if (!this.state.authorityContract) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (country.length === 0 || country.length > 3) return { ok: false, value: ERR_INVALID_COUNTRY };
    if (briberyScore > 100 || transparencyScore > 100 || auditScore > 100) return { ok: false, value: ERR_INVALID_SCORE };
    const current = this.state.countryIndices.get(country) || { score: 0, lastUpdated: 0, submissionCount: 0, briberyWeight: this.state.briberyWeight, transparencyWeight: this.state.transparencyWeight, auditWeight: this.state.auditWeight };
    const score = this.state.calcMethod === "weighted-average"
      ? Math.min((briberyScore * this.state.briberyWeight + transparencyScore * this.state.transparencyWeight + auditScore * this.state.auditWeight) / 100, 10000)
      : Math.min((briberyScore + transparencyScore + auditScore) / 3, 10000);
    const newIndex: Index = {
      score,
      lastUpdated: this.blockHeight,
      submissionCount: current.submissionCount + 1,
      briberyWeight: this.state.briberyWeight,
      transparencyWeight: this.state.transparencyWeight,
      auditWeight: this.state.auditWeight,
    };
    this.state.countryIndices.set(country, newIndex);
    return { ok: true, value: score };
  }

  getIndex(country: string): Index | null {
    return this.state.countryIndices.get(country) || null;
  }

  getSubmission(id: number): Submission | null {
    return this.state.dataSubmissions.get(id) || null;
  }

  getVerification(id: number): Verification | null {
    return this.state.submissionVerifications.get(id) || null;
  }

  getCurrentWeights(): { bribery: number; transparency: number; audit: number } {
    return { bribery: this.state.briberyWeight, transparency: this.state.transparencyWeight, audit: this.state.auditWeight };
  }

  getCalcMethod(): string {
    return this.state.calcMethod;
  }
}

describe("IndexCalculationContract", () => {
  let contract: IndexCalculationMock;

  beforeEach(() => {
    contract = new IndexCalculationMock();
    contract.reset();
  });

  it("submits data successfully", () => {
    const result = contract.submitData("USA", 80, 90, 85);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);
    const submission = contract.getSubmission(0);
    expect(submission).toEqual({ country: "USA", briberyScore: 80, transparencyScore: 90, auditScore: 85, timestamp: 0, submitter: "ST1TEST" });
    const verification = contract.getVerification(0);
    expect(verification).toEqual({ verifierCount: 0, approved: false, timestamp: 0 });
  });

  it("rejects invalid country code", () => {
    const result = contract.submitData("USAA", 80, 90, 85);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_COUNTRY);
  });

  it("rejects invalid score", () => {
    const result = contract.submitData("USA", 101, 90, 85);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_SCORE);
  });

  it("verifies submission and updates index", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.submitData("USA", 80, 90, 85);
    contract.verifySubmission(0);
    contract.verifySubmission(0);
    const result = contract.verifySubmission(0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const verification = contract.getVerification(0);
    expect(verification?.verifierCount).toBe(3);
    expect(verification?.approved).toBe(true);
    const index = contract.getIndex("USA");
    const expectedScore = (80 * 40 + 90 * 30 + 85 * 30) / 100;
    expect(index?.score).toBe(expectedScore);
    expect(index?.submissionCount).toBe(1);
    expect(index?.lastUpdated).toBe(0);
  });

  it("rejects verification by unauthorized caller", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.submitData("USA", 80, 90, 85);
    contract.caller = "ST3FAKE";
    contract.authorities = new Set();
    const result = contract.verifySubmission(0);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("sets weights successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.setWeights(50, 30, 20);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const weights = contract.getCurrentWeights();
    expect(weights).toEqual({ bribery: 50, transparency: 30, audit: 20 });
  });

  it("rejects invalid weights", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.setWeights(60, 30, 20);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("sets calculation method successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.setCalcMethod("simple-average");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.getCalcMethod()).toBe("simple-average");
  });

  it("rejects invalid calculation method", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.setCalcMethod("invalid");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_CALC_METHOD);
  });

  it("rejects update index without authority", () => {
    const result = contract.updateIndex("USA", 80, 90, 85);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("uses simple-average method correctly", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.setCalcMethod("simple-average");
    contract.submitData("USA", 80, 90, 85);
    contract.verifySubmission(0);
    contract.verifySubmission(0);
    contract.verifySubmission(0);
    const index = contract.getIndex("USA");
    const expectedScore = (80 + 90 + 85) / 3;
    expect(index?.score).toBe(expectedScore);
  });
});