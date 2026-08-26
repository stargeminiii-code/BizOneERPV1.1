import {
  EffectiveDatedEntity,
  TemporalResolutionResult,
  TemporalResolutionStatus,
  VersionStatus
} from '../../types';

export class EffectiveDateResolver {
  /**
   * Normalize any date string / Date object into a comparable timestamp (ms)
   */
  static normalizeTimestamp(dateInput: string | Date | number): number {
    if (typeof dateInput === 'number') return dateInput;
    if (dateInput instanceof Date) return dateInput.getTime();
    if (!dateInput) return Date.now();

    // If it's a date-only string like YYYY-MM-DD, treat as UTC midnight or local
    const parsed = new Date(dateInput);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date format: ${dateInput}`);
    }
    return parsed.getTime();
  }

  /**
   * Formats timestamp to standard ISO or YYYY-MM-DD
   */
  static formatDate(dateInput: string | Date | number): string {
    const d = new Date(this.normalizeTimestamp(dateInput));
    return d.toISOString();
  }

  /**
   * Resolves the single valid version of an effective-dated entity applicable at the given timestamp.
   *
   * Rules:
   * 1. effectiveFrom <= effectiveAt
   * 2. (effectiveTo is null OR effectiveAt < effectiveTo)
   * 3. Multiple matching versions -> INTEGRITY_VIOLATION
   * 4. No matching version -> NOT_AVAILABLE (explicit, never silently fallback to current)
   */
  static resolveVersion<T extends EffectiveDatedEntity>(
    versions: T[],
    effectiveAt: string | Date | number
  ): TemporalResolutionResult<T> {
    const targetTime = this.normalizeTimestamp(effectiveAt);
    const targetIso = new Date(targetTime).toISOString();

    if (!versions || versions.length === 0) {
      return {
        status: 'NOT_AVAILABLE',
        version: null,
        resolvedAt: targetIso,
        errorMessage: 'No versions exist for the specified entity.'
      };
    }

    const matches = versions.filter((v) => {
      // Must not be archived/draft unless explicitly handled
      if (v.status === 'ARCHIVED' || v.status === 'DRAFT') return false;

      const fromTime = this.normalizeTimestamp(v.effectiveFrom);
      const toTime = v.effectiveTo ? this.normalizeTimestamp(v.effectiveTo) : null;

      const isFromValid = fromTime <= targetTime;
      const isToValid = toTime === null || targetTime < toTime;

      return isFromValid && isToValid;
    });

    if (matches.length === 0) {
      return {
        status: 'NOT_AVAILABLE',
        version: null,
        resolvedAt: targetIso,
        errorMessage: `No applicable version found for timestamp ${targetIso}.`
      };
    }

    if (matches.length > 1) {
      return {
        status: 'INTEGRITY_VIOLATION',
        version: null,
        resolvedAt: targetIso,
        errorMessage: `Data integrity violation: Multiple overlapping versions (${matches.map((m) => `V${m.version} [${m.effectiveFrom} -> ${m.effectiveTo || 'OPEN'}]`).join(', ')}) match target timestamp ${targetIso}.`
      };
    }

    return {
      status: 'SUCCESS',
      version: matches[0],
      resolvedAt: targetIso
    };
  }

  /**
   * Validates whether a collection of versions has overlapping effective periods.
   */
  static detectOverlaps<T extends EffectiveDatedEntity>(
    versions: T[]
  ): { hasOverlap: boolean; overlappingPair?: [T, T]; errorMessage?: string } {
    const validList = versions.filter((v) => v.status !== 'ARCHIVED' && v.status !== 'DRAFT');

    for (let i = 0; i < validList.length; i++) {
      const a = validList[i];
      const aFrom = this.normalizeTimestamp(a.effectiveFrom);
      const aTo = a.effectiveTo ? this.normalizeTimestamp(a.effectiveTo) : Infinity;

      if (aTo <= aFrom) {
        return {
          hasOverlap: true,
          overlappingPair: [a, a],
          errorMessage: `Version ${a.version} has invalid period: effectiveTo (${a.effectiveTo}) is earlier than or equal to effectiveFrom (${a.effectiveFrom}).`
        };
      }

      for (let j = i + 1; j < validList.length; j++) {
        const b = validList[j];
        const bFrom = this.normalizeTimestamp(b.effectiveFrom);
        const bTo = b.effectiveTo ? this.normalizeTimestamp(b.effectiveTo) : Infinity;

        // Check intersection of [aFrom, aTo) and [bFrom, bTo)
        const hasIntersection = Math.max(aFrom, bFrom) < Math.min(aTo, bTo);
        if (hasIntersection) {
          return {
            hasOverlap: true,
            overlappingPair: [a, b],
            errorMessage: `Overlapping effective periods detected between Version ${a.version} (${a.effectiveFrom} to ${a.effectiveTo || 'OPEN'}) and Version ${b.version} (${b.effectiveFrom} to ${b.effectiveTo || 'OPEN'}).`
          };
        }
      }
    }

    return { hasOverlap: false };
  }

  /**
   * Immutably creates a new version, closing the currently active prior version and preventing period overlaps.
   */
  static createNextVersion<T extends EffectiveDatedEntity>(
    existingVersions: T[],
    newDraft: {
      tenantId: string;
      effectiveFrom: string;
      effectiveTo?: string | null;
      createdBy: string;
      [key: string]: any;
    },
    versionIdPrefix = 'VER'
  ): {
    success: boolean;
    newVersion?: T;
    updatedVersions?: T[];
    errorMessage?: string;
  } {
    const newFromTime = this.normalizeTimestamp(newDraft.effectiveFrom);
    const newToTime = newDraft.effectiveTo ? this.normalizeTimestamp(newDraft.effectiveTo) : Infinity;

    if (newToTime <= newFromTime) {
      return {
        success: false,
        errorMessage: 'effectiveTo must be strictly greater than effectiveFrom.'
      };
    }

    // Find previous open or active versions
    const sorted = [...existingVersions].sort(
      (a, b) => this.normalizeTimestamp(a.effectiveFrom) - this.normalizeTimestamp(b.effectiveFrom)
    );

    const maxVersionNum = sorted.reduce((max, v) => Math.max(max, v.version || 0), 0);
    const nextVersionNum = maxVersionNum + 1;

    // Find the immediate predecessor version that was open or starts before newFromTime
    const updatedVersions: T[] = sorted.map((v) => ({ ...v }));
    let supersededVersion: T | undefined;

    for (let i = 0; i < updatedVersions.length; i++) {
      const v = updatedVersions[i];
      const vFrom = this.normalizeTimestamp(v.effectiveFrom);
      const vTo = v.effectiveTo ? this.normalizeTimestamp(v.effectiveTo) : Infinity;

      // If existing version starts at or after the new version's start date
      if (vFrom >= newFromTime) {
        return {
          success: false,
          errorMessage: `Cannot create version starting at ${newDraft.effectiveFrom} because existing Version ${v.version} starts at ${v.effectiveFrom}. Future versions must not be retroactively superseded without explicit management.`
        };
      }

      // If existing version is currently open (effectiveTo is null or after newFromTime)
      if (vTo > newFromTime) {
        // Close it cleanly at newFromTime
        v.effectiveTo = newDraft.effectiveFrom;
        v.status = 'SUPERSEDED';
        supersededVersion = v;
      }
    }

    const versionId = `${versionIdPrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newEntity = {
      ...newDraft,
      versionId,
      version: nextVersionNum,
      effectiveFrom: newDraft.effectiveFrom,
      effectiveTo: newDraft.effectiveTo || null,
      status: 'ACTIVE' as VersionStatus,
      createdAt: new Date().toISOString(),
      createdBy: newDraft.createdBy,
      supersedesVersionId: supersededVersion ? supersededVersion.versionId : undefined
    } as unknown as T;

    updatedVersions.push(newEntity);

    // Validate no overlaps
    const overlapCheck = this.detectOverlaps(updatedVersions);
    if (overlapCheck.hasOverlap) {
      return {
        success: false,
        errorMessage: overlapCheck.errorMessage || 'Period overlap detected when creating version.'
      };
    }

    return {
      success: true,
      newVersion: newEntity,
      updatedVersions
    };
  }
}
