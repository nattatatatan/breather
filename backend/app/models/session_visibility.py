from enum import Enum


class SessionVisibility(str, Enum):
    PRIVATE = "private"
    COMMUNITY = "community"
