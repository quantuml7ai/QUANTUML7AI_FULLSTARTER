class BatchQueue:
 def __init__(self,max_batch=16):self.max_batch=max_batch
 def split(self,rows):return [rows[i:i+self.max_batch] for i in range(0,len(rows),self.max_batch)]
