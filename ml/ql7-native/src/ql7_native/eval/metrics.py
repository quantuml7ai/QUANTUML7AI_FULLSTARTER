def confusion(y_true,y_pred):
 labels=sorted(set(y_true)|set(y_pred));return {l:{'tp':sum(a==l and b==l for a,b in zip(y_true,y_pred)),'fp':sum(a!=l and b==l for a,b in zip(y_true,y_pred)),'fn':sum(a==l and b!=l for a,b in zip(y_true,y_pred))} for l in labels}
