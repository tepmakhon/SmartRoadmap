from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.crud.roadmap import ReferenceNotFound


def required(record):
    if record is None:
        raise HTTPException(404, "Item not found")
    return record


def write(operation, *args):
    try:
        return required(operation(*args))
    except ReferenceNotFound as exc:
        raise HTTPException(404, str(exc)) from None
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from None
    except IntegrityError:
        raise HTTPException(
            409, "Item already exists or a referenced item is unavailable"
        ) from None
