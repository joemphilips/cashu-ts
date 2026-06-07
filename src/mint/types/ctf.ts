import type {
  Proof,
  SerializedBlindedMessage,
  SerializedBlindedSignature,
} from '../../model/types';

export interface CtfConditionInfo {
  condition_id: string;
  threshold?: number;
  tags?: string[][];
  announcements?: string[];
  keysets: Record<string, string>;
  registered_at?: number;
  condition_type?: string;
  lo_bound?: number;
  hi_bound?: number;
  precision?: number;
  attestation?: {
    status: string;
    winning_outcome?: string | null;
    attested_at?: number | null;
  };
}

export interface ConditionalKeysetInfo {
  id: string;
  unit: string;
  active: boolean;
  input_fee_ppk?: number;
  final_expiry?: number;
  condition_id: string;
  outcome_collection: string;
  outcome_collection_id: string;
  registered_at?: number;
}

export interface GetConditionalKeysetsQuery {
  since?: number;
  limit?: number;
  active?: boolean;
}

export interface ConditionalKeysetsResponse {
  keysets: ConditionalKeysetInfo[];
}

export interface GetConditionsQuery {
  since?: number;
  limit?: number;
  status?: string[];
}

export interface GetConditionsResponse {
  conditions: CtfConditionInfo[];
}

export interface RegisterConditionRequest {
  threshold?: number;
  tags?: string[][];
  announcements: string[];
  collateral?: string;
  outcome_collections?: string[];
  fee?: Proof[];
  outputs?: SerializedBlindedMessage[];
  condition_type?: string;
  lo_bound?: number;
  hi_bound?: number;
  precision?: number;
}

export interface RegisterConditionResponse {
  condition_id: string;
  keysets: Record<string, string>;
  change?: SerializedBlindedSignature[];
}

export interface CtfConvertRequest {
  condition_id: string;
  parent_collection_id?: string;
  inputs: Record<string, Proof[]>;
  outputs: Record<string, SerializedBlindedMessage[]>;
}

export interface CtfConvertResponse {
  signatures: Record<string, SerializedBlindedSignature[]>;
}

export interface RedeemOutcomeRequest {
  inputs: Proof[];
  outputs: SerializedBlindedMessage[];
}

export interface RedeemOutcomeResponse {
  signatures: SerializedBlindedSignature[];
}
