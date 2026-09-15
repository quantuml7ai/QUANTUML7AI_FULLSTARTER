import governance from '../../../../config/runtime-governance.json';

export function resolveRouteProfile(route, deviceClass = 'coarse') {
  const normalizedRoute = String(route || '').trim();
  const assignment = governance.routeAssignments.find((item) => String(item.route || '') === normalizedRoute);
  if (!assignment) return null;
  if (assignment.type === 'device-class') {
    return assignment.profiles?.[deviceClass === 'fine' ? 'fine' : 'coarse'] || null;
  }
  return assignment.profile || null;
}

export function resolveRouteAssignment(route) {
  const normalizedRoute = String(route || '').trim();
  return governance.routeAssignments.find((item) => String(item.route || '') === normalizedRoute) || null;
}
