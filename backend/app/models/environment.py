from enum import Enum


# still: object stays fixed. dissolve: object dissolves into light - only
# meaningful when the element is fire (fire kasina "the dissolve").
class Environment(str, Enum):
    STILL = "still"
    DISSOLVE = "dissolve"
