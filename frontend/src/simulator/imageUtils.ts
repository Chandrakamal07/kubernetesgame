import type { NormalizedImage } from './types.ts';

/**
 * Normalizes container image strings into canonical registry, repository, and tag components.
 * Examples:
 *   "nginx" -> { registry: "docker.io", repository: "library/nginx", tag: "latest" }
 *   "nginx:1.25" -> { registry: "docker.io", repository: "library/nginx", tag: "1.25" }
 *   "quay.io/coreos/etcd:v3.5" -> { registry: "quay.io", repository: "coreos/etcd", tag: "v3.5" }
 */
export function normalizeImage(imageStr: string): NormalizedImage {
  const trimmed = (imageStr || '').trim();
  if (!trimmed) {
    return {
      registry: 'docker.io',
      repository: 'library/unknown',
      tag: 'latest',
      fullName: 'docker.io/library/unknown:latest',
    };
  }

  let tag = 'latest';
  let path = trimmed;

  // Check for digest or tag
  const lastColon = path.lastIndexOf(':');
  const lastSlash = path.lastIndexOf('/');

  if (lastColon > lastSlash && lastColon !== -1) {
    tag = path.substring(lastColon + 1);
    path = path.substring(0, lastColon);
  }

  const slashParts = path.split('/');
  let registry = 'docker.io';
  let repository = '';

  if (slashParts.length === 1) {
    // e.g. "nginx" -> registry: "docker.io", repo: "library/nginx"
    repository = `library/${slashParts[0]}`;
  } else if (slashParts.length === 2) {
    if (slashParts[0].includes('.') || slashParts[0].includes(':')) {
      registry = slashParts[0];
      repository = slashParts[1];
    } else {
      registry = 'docker.io';
      repository = `${slashParts[0]}/${slashParts[1]}`;
    }
  } else {
    // 3 or more parts e.g. "gcr.io/google-samples/app"
    registry = slashParts[0];
    repository = slashParts.slice(1).join('/');
  }

  const fullName = `${registry}/${repository}:${tag}`;

  return {
    registry,
    repository,
    tag,
    fullName,
  };
}

/**
 * Checks if a pod's image satisfies a target image requirement.
 * Accepts exact matches, bare repository matches (e.g. "nginx" matches "nginx:latest" or "docker.io/library/nginx:latest"),
 * but strictly rejects unrelated substrings (e.g. "my-nginx-broken" will NOT match "nginx").
 */
export function matchesRequiredImage(podImage: string | NormalizedImage, requiredImageStr: string): boolean {
  const podNorm = typeof podImage === 'string' ? normalizeImage(podImage) : podImage;
  const reqNorm = normalizeImage(requiredImageStr);

  // If required image specifies a specific non-latest tag, tag must match
  if (requiredImageStr.includes(':') && reqNorm.tag !== 'latest') {
    return podNorm.repository === reqNorm.repository && podNorm.tag === reqNorm.tag;
  }

  // Otherwise compare repository (e.g. library/nginx == library/nginx)
  const podRepoBase = podNorm.repository.replace(/^library\//, '');
  const reqRepoBase = reqNorm.repository.replace(/^library\//, '');

  return podRepoBase === reqRepoBase;
}

/**
 * Parses CPU quantity string into fractional cores.
 * "500m" -> 0.5
 * "250m" -> 0.25
 * "1" -> 1.0
 * "2.5" -> 2.5
 */
export function parseCpuQuantity(cpuStr: string | number): number {
  if (typeof cpuStr === 'number') return cpuStr;
  const str = (cpuStr || '').trim().toLowerCase();
  if (!str) return 0;

  if (str.endsWith('m')) {
    const val = parseFloat(str.slice(0, -1));
    return isNaN(val) ? 0 : val / 1000;
  }
  const val = parseFloat(str);
  return isNaN(val) ? 0 : val;
}

/**
 * Parses Memory quantity string into MiB (Mebibytes).
 * "1024Mi" -> 1024
 * "1Gi" -> 1024
 * "2Gi" -> 2048
 * "512M" -> 512
 * "256Mi" -> 256
 */
export function parseMemoryQuantity(memStr: string | number): number {
  if (typeof memStr === 'number') return memStr;
  const str = (memStr || '').trim();
  if (!str) return 0;

  if (str.endsWith('Gi')) {
    const val = parseFloat(str.slice(0, -2));
    return isNaN(val) ? 0 : Math.round(val * 1024);
  }
  if (str.endsWith('G')) {
    const val = parseFloat(str.slice(0, -1));
    return isNaN(val) ? 0 : Math.round(val * 1024);
  }
  if (str.endsWith('Mi')) {
    const val = parseFloat(str.slice(0, -2));
    return isNaN(val) ? 0 : Math.round(val);
  }
  if (str.endsWith('M')) {
    const val = parseFloat(str.slice(0, -1));
    return isNaN(val) ? 0 : Math.round(val);
  }
  if (str.endsWith('Ki')) {
    const val = parseFloat(str.slice(0, -2));
    return isNaN(val) ? 0 : Math.round(val / 1024);
  }
  const val = parseFloat(str);
  return isNaN(val) ? 0 : Math.round(val);
}

/**
 * Formats fractional cores into millicores or integer core string.
 * 0.25 -> "250m"
 * 0.5 -> "500m"
 * 1.0 -> "1000m"
 */
export function formatCpu(cores: number): string {
  if (cores === 0) return '0';
  return `${Math.round(cores * 1000)}m`;
}

/**
 * Formats memory in MiB into standard representation.
 * 1024 -> "1024Mi"
 * 256 -> "256Mi"
 */
export function formatMemory(mi: number): string {
  if (mi === 0) return '0Mi';
  return `${Math.round(mi)}Mi`;
}
