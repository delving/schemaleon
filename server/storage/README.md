
# Storage Module

The database is organized as follows:

/i18n

- en.xml and other languages
- contains labels and field names, and field documentation

/log

- contains a log file for each day with the activities recorded

/people/groups, /people/users

- contains one document per group
- one document per user

/schemas/primary, /primary/[group name]/[schema name]

- the primary schemas
- group specific documents for each schema

/schemas/shared, /shared/[schema name]

- documents for shared schemas

/schemas/system, /system/[schema name]

- schemas which are not visible

/vocabulary

- contains one file per vocabulary