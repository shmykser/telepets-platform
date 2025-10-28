import sqlite3

conn = sqlite3.connect('telepets_dev.db')
cursor = conn.cursor()

# Таблицы
cursor.execute('SELECT name FROM sqlite_master WHERE type="table"')
tables = [t[0] for t in cursor.fetchall()]
print('Tablicy:', tables)
print()

# Dannye po kazhdoy tablice
for table in tables:
    try:
        cursor.execute(f'SELECT COUNT(*) FROM {table}')
        count = cursor.fetchone()[0]
        print(f'   {table}: {count} zapisey')
    except:
        pass

# Primery dannyh
print('\nPrimery dannyh:')
print('\n--- Users ---')
cursor.execute('SELECT * FROM users LIMIT 3')
for row in cursor.fetchall():
    print(row)

print('\n--- Pets ---')
cursor.execute('SELECT * FROM pets LIMIT 3')
for row in cursor.fetchall():
    print(row)

conn.close()

