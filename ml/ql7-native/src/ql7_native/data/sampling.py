def temperature_locale_distribution(counts, alpha=0.5):
    if not 0 < float(alpha) < 1: raise ValueError("alpha_must_be_between_zero_and_one")
    clean={str(k):max(0,int(v)) for k,v in dict(counts).items()}
    total=sum(clean.values())
    if total<=0: raise ValueError("positive_locale_counts_required")
    p={k:v/total for k,v in clean.items()}; z=sum(v**alpha for v in p.values())
    return {k:(v**alpha)/z for k,v in p.items()}
