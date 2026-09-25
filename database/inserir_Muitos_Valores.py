from typing import List, Tuple

from psycopg2 import DatabaseError
from psycopg2.extensions import connection
from psycopg2.extras import execute_values


def insert_many_values(
    conn: connection,
    table_name: str,
    columns: Tuple[str, ...],
    values: List[Tuple],
    batch_size: int = 1500,
) -> None:
    """Insere várias linhas em lote e preserva a atomicidade da operação."""
    if not values:
        return

    cols = ", ".join(columns)
    query = f"INSERT INTO {table_name} ({cols}) VALUES %s"

    try:
        with conn.cursor() as cursor:
            execute_values(
                cursor,
                query,
                values,
                page_size=batch_size,
            )
        conn.commit()
    except DatabaseError:
        conn.rollback()
        raise
