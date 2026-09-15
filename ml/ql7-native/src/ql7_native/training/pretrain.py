from .core import train_from_config

def run(config,dataset,model=None,loss_fn=None):
    if not config or dataset is None:
        raise ValueError("training_inputs_required")
    return {"stage":"pretrain",**train_from_config(model,dataset,config,loss_fn=loss_fn,stage="pretrain")}
