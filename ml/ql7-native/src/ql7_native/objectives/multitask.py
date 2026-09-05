def weighted_multitask(losses, weights):
    if not losses: raise ValueError("losses_required")
    total=None
    for name,loss in losses.items():
        w=float(weights.get(name,1.0)); total=loss*w if total is None else total+loss*w
    return total
