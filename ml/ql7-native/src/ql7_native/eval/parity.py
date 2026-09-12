def field_parity(frames, fields):
    frames=list(frames)
    if not frames: return {"ok":False,"mismatches":["no_frames"]}
    base=frames[0]; mism=[]
    for i,row in enumerate(frames[1:],1):
        for field in fields:
            if row.get(field)!=base.get(field): mism.append({"frame":i,"field":field,"expected":base.get(field),"actual":row.get(field)})
    return {"ok":not mism,"mismatches":mism}
