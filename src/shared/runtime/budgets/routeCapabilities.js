import { getRouteConstitutionDefaults, getRouteProfile } from './routeProfiles.js';
import { resolveRouteAssignment, resolveRouteProfile } from './routeProfileResolver.js';

export function readRouteCapabilities(route, deviceClass = 'coarse') {
  const profileId = resolveRouteProfile(route, deviceClass);
  const profile = profileId ? getRouteProfile(profileId) : null;
  const assignment = resolveRouteAssignment(route);
  return {
    route: String(route || ''),
    deviceClass: deviceClass === 'fine' ? 'fine' : 'coarse',
    profileId,
    profile,
    assignment,
    constitutionDefaults: getRouteConstitutionDefaults(),
  };
}
