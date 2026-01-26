ALTER TABLE users ADD COLUMN first_name TEXT;
ALTER TABLE users ADD COLUMN last_name TEXT;

UPDATE users
SET
  first_name = CASE
    WHEN INSTR(name, ' ') > 0 THEN SUBSTR(name, 1, INSTR(name, ' ') - 1)
    ELSE name
  END,
  last_name = CASE
    WHEN INSTR(name, ' ') > 0 THEN SUBSTR(name, INSTR(name, ' ') + 1)
    ELSE ''
  END
WHERE (first_name IS NULL OR last_name IS NULL) AND name IS NOT NULL;
