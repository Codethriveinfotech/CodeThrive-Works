const { pool } = require('../config/db');

// Convert camelCase to snake_case
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Convert snake_case to camelCase
function toCamelCase(str) {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

class Document {
  constructor(data, model) {
    this._model = model;
    this._original = {};

    for (const [k, v] of Object.entries(data)) {
      this[k] = v;
      const camel = toCamelCase(k);
      const snake = toSnakeCase(k);
      this[camel] = v;
      this[snake] = v;
      this._original[snake] = v;
    }

    // Ensure _id and id are identical
    const recordId = data.id || data._id;
    if (recordId) {
      this.id = recordId;
      this._id = recordId;
    }

    // Aliases for relations when unpopulated
    if (this.employee_id && !this.employee) this.employee = this.employee_id;
    if (this.user_id && !this.user) this.user = this.user_id;
    if (this.attendance_id && !this.attendanceId) this.attendanceId = this.attendance_id;
    if (this.assigned_to_id && !this.assignedTo) this.assignedTo = this.assigned_to_id;
    if (this.assigned_by_id && !this.assignedBy) this.assignedBy = this.assigned_by_id;
    if (this.organizer_id && !this.organizer) this.organizer = this.organizer_id;
    if (this.recipient_id && !this.recipient) this.recipient = this.recipient_id;
    if (this.owner_id && !this.owner) this.owner = this.owner_id;
    if (this.task_id && !this.task) this.task = this.task_id;
  }

  async save() {
    return await this._model.saveDocument(this);
  }

  toObject() {
    const obj = { ...this };
    delete obj._model;
    delete obj._original;
    return obj;
  }

  toJSON() {
    return this.toObject();
  }
}

class QueryBuilder {
  constructor(model, filter = {}) {
    this.model = model;
    this.filter = filter;
    this._sort = null;
    this._limit = null;
    this._skip = null;
    this._select = null;
    this._populates = [];
    this._single = false;
  }

  sort(sortOptions) {
    this._sort = sortOptions;
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  skip(n) {
    this._skip = n;
    return this;
  }

  select(fields) {
    this._select = fields;
    return this;
  }

  lean() {
    return this;
  }

  where(clause) {
    if (typeof clause === 'object') {
      Object.assign(this.filter, clause);
    }
    return this;
  }

  collation() {
    return this;
  }

  populate(field, select) {
    if (typeof field === 'object' && field !== null) {
      this._populates.push({ field: field.path, select: field.select });
    } else {
      this._populates.push({ field, select });
    }
    return this;
  }

  async exec() {
    return await this.model._executeQuery(this);
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

class BaseModel {
  constructor(tableName, relationMap = {}) {
    this.tableName = tableName;
    this.relationMap = relationMap;
  }

  createDocument(data) {
    return new Document(data, this);
  }

  // Map JS filter keys to DB columns
  mapFieldToColumn(field) {
    if (field === '_id' || field === 'id') return 'id';
    if (this.relationMap[field]) return this.relationMap[field].foreignKey;
    return toSnakeCase(field);
  }

  // Build SQL WHERE clause from Mongo-like filter
  buildWhereClause(filter, startParamIndex = 1) {
    const conditions = [];
    const values = [];
    let paramIndex = startParamIndex;

    const processFilterObject = (obj) => {
      const subConditions = [];
      for (const [key, value] of Object.entries(obj)) {
        if (key === '$or' && Array.isArray(value)) {
          const orParts = [];
          for (const orObj of value) {
            const orRes = processFilterObject(orObj);
            if (orRes.clause) orParts.push(`(${orRes.clause})`);
          }
          if (orParts.length > 0) {
            subConditions.push(`(${orParts.join(' OR ')})`);
          }
          continue;
        }

        const col = this.mapFieldToColumn(key);

        if (value === null || value === undefined) {
          subConditions.push(`${col} IS NULL`);
        } else if (typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
          // Complex operators: $in, $gte, $lte, $gt, $lt, $ne
          for (const [op, opVal] of Object.entries(value)) {
            if (op === '$in' && Array.isArray(opVal)) {
              if (opVal.length === 0) {
                subConditions.push('FALSE');
              } else {
                const placeholders = opVal.map(() => `$${paramIndex++}`).join(', ');
                subConditions.push(`${col} IN (${placeholders})`);
                values.push(...opVal);
              }
            } else if (op === '$gte') {
              subConditions.push(`${col} >= $${paramIndex++}`);
              values.push(opVal);
            } else if (op === '$lte') {
              subConditions.push(`${col} <= $${paramIndex++}`);
              values.push(opVal);
            } else if (op === '$gt') {
              subConditions.push(`${col} > $${paramIndex++}`);
              values.push(opVal);
            } else if (op === '$lt') {
              subConditions.push(`${col} < $${paramIndex++}`);
              values.push(opVal);
            } else if (op === '$ne') {
              subConditions.push(`${col} != $${paramIndex++}`);
              values.push(opVal);
            }
          }
        } else {
          // Exact match
          subConditions.push(`${col} = $${paramIndex++}`);
          values.push(value);
        }
      }

      return {
        clause: subConditions.join(' AND ')
      };
    };

    if (filter && typeof filter === 'object' && Object.keys(filter).length > 0) {
      processFilterObject(filter);
    }

    return {
      clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      values,
      paramIndex
    };
  }

  // Execute query from QueryBuilder
  async _executeQuery(qb) {
    let sql = `SELECT * FROM ${this.tableName}`;
    const values = [];
    let paramIndex = 1;

    // Filter
    const filterConditions = [];
    if (qb.filter && typeof qb.filter === 'object') {
      const buildConditions = (obj) => {
        for (const [key, val] of Object.entries(obj)) {
          if (key === '$or' && Array.isArray(val)) {
            const orParts = [];
            for (const orObj of val) {
              const innerParts = [];
              for (const [k, v] of Object.entries(orObj)) {
                const col = this.mapFieldToColumn(k);
                if (col === 'participants') {
                  innerParts.push(`${col}::text LIKE '%' || $${paramIndex++} || '%'`);
                  values.push(String(v));
                } else if (v && typeof v === 'object' && v.$in) {
                  const ph = v.$in.map(() => `$${paramIndex++}`).join(', ');
                  innerParts.push(`${col} IN (${ph})`);
                  values.push(...v.$in);
                } else if (v === null) {
                  innerParts.push(`${col} IS NULL`);
                } else {
                  innerParts.push(`${col} = $${paramIndex++}`);
                  values.push(v);
                }
              }
              if (innerParts.length) orParts.push(`(${innerParts.join(' AND ')})`);
            }
            if (orParts.length) filterConditions.push(`(${orParts.join(' OR ')})`);
            continue;
          }

          const col = this.mapFieldToColumn(key);
          if (col === 'participants') {
            filterConditions.push(`${col}::text LIKE '%' || $${paramIndex++} || '%'`);
            values.push(String(val));
          } else if (val === null || val === undefined) {
            filterConditions.push(`${col} IS NULL`);
          } else if (typeof val === 'object' && !(val instanceof Date) && !Array.isArray(val)) {
            for (const [op, opVal] of Object.entries(val)) {
              if (op === '$in' && Array.isArray(opVal)) {
                if (opVal.length === 0) {
                  filterConditions.push('FALSE');
                } else {
                  const ph = opVal.map(() => `$${paramIndex++}`).join(', ');
                  filterConditions.push(`${col} IN (${ph})`);
                  values.push(...opVal);
                }
              } else if (op === '$gte') {
                filterConditions.push(`${col} >= $${paramIndex++}`);
                values.push(opVal);
              } else if (op === '$lte') {
                filterConditions.push(`${col} <= $${paramIndex++}`);
                values.push(opVal);
              } else if (op === '$gt') {
                filterConditions.push(`${col} > $${paramIndex++}`);
                values.push(opVal);
              } else if (op === '$lt') {
                filterConditions.push(`${col} < $${paramIndex++}`);
                values.push(opVal);
              } else if (op === '$ne') {
                filterConditions.push(`${col} != $${paramIndex++}`);
                values.push(opVal);
              }
            }
          } else {
            filterConditions.push(`${col} = $${paramIndex++}`);
            values.push(val);
          }
        }
      };

      buildConditions(qb.filter);
    }

    if (filterConditions.length > 0) {
      sql += ` WHERE ${filterConditions.join(' AND ')}`;
    }

    // Sort
    if (qb._sort) {
      const orderParts = [];
      if (typeof qb._sort === 'string') {
        const parts = qb._sort.trim().split(/\s+/);
        for (const p of parts) {
          if (p.startsWith('-')) {
            orderParts.push(`${this.mapFieldToColumn(p.slice(1))} DESC`);
          } else {
            orderParts.push(`${this.mapFieldToColumn(p)} ASC`);
          }
        }
      } else if (typeof qb._sort === 'object') {
        for (const [k, dir] of Object.entries(qb._sort)) {
          if (k.includes('.')) continue;
          const col = this.mapFieldToColumn(k);
          orderParts.push(`${col} ${dir === -1 || dir === 'desc' ? 'DESC' : 'ASC'}`);
        }
      }
      if (orderParts.length > 0) {
        sql += ` ORDER BY ${orderParts.join(', ')}`;
      }
    } else {
      sql += ` ORDER BY created_at DESC`;
    }

    // Limit / Skip
    if (qb._limit) {
      sql += ` LIMIT ${parseInt(qb._limit, 10)}`;
    }
    if (qb._skip) {
      sql += ` OFFSET ${parseInt(qb._skip, 10)}`;
    }

    const res = await pool.query(sql, values);
    let docs = res.rows.map(r => this.createDocument(r));

    // Handle Population
    if (qb._populates.length > 0 && docs.length > 0) {
      for (const pop of qb._populates) {
        await this._populateDocs(docs, pop.field, pop.select);
      }
    }

    if (qb._single) {
      return docs.length > 0 ? docs[0] : null;
    }
    return docs;
  }

  async _populateDocs(docs, field, select) {
    const rel = this.relationMap[field];
    if (!rel) return;

    const foreignKey = rel.foreignKey;
    const targetTable = rel.table;
    const targetIdCol = rel.targetKey || 'id';

    const idsToFetch = [...new Set(docs.map(d => d[foreignKey] || d[field]).filter(Boolean))];
    if (idsToFetch.length === 0) return;

    const placeholders = idsToFetch.map((_, i) => `$${i + 1}`).join(', ');
    const res = await pool.query(
      `SELECT * FROM ${targetTable} WHERE ${targetIdCol} IN (${placeholders})`,
      idsToFetch
    );

    const targetMap = {};
    for (const row of res.rows) {
      let doc;
      if (rel.table === 'users') {
        const User = require('./User');
        doc = User.createDocument(row);
      } else if (rel.model) {
        doc = rel.model.createDocument(row);
      } else {
        doc = new Document(row, null);
      }
      targetMap[row[targetIdCol]] = doc;
    }

    for (const d of docs) {
      const fkVal = d[foreignKey] || d[field];
      if (fkVal && targetMap[fkVal]) {
        d[field] = targetMap[fkVal];
      }
    }
  }

  // Model methods
  find(filter = {}) {
    return new QueryBuilder(this, filter);
  }

  findOne(filter = {}) {
    const qb = new QueryBuilder(this, filter);
    qb._single = true;
    return qb;
  }

  findById(id) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));
    if (!id || !isUuid) {
      const qb = new QueryBuilder(this, { id: '00000000-0000-0000-0000-000000000000' }).limit(1);
      qb._single = true;
      return qb;
    }
    const qb = new QueryBuilder(this, { id: String(id) });
    qb._single = true;
    return qb;
  }

  async countDocuments(filter = {}) {
    const qb = new QueryBuilder(this, filter);
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const values = [];
    let paramIndex = 1;

    const filterConditions = [];
    if (qb.filter && typeof qb.filter === 'object') {
      for (const [key, val] of Object.entries(qb.filter)) {
        const col = this.mapFieldToColumn(key);
        if (val === null) {
          filterConditions.push(`${col} IS NULL`);
        } else if (typeof val === 'object' && val.$in) {
          const ph = val.$in.map(() => `$${paramIndex++}`).join(', ');
          filterConditions.push(`${col} IN (${ph})`);
          values.push(...val.$in);
        } else {
          filterConditions.push(`${col} = $${paramIndex++}`);
          values.push(val);
        }
      }
    }
    if (filterConditions.length > 0) {
      sql += ` WHERE ${filterConditions.join(' AND ')}`;
    }

    const res = await pool.query(sql, values);
    return parseInt(res.rows[0].count, 10);
  }

  async getTableColumns() {
    if (this._tableColumns) return this._tableColumns;
    try {
      const res = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
        [this.tableName]
      );
      this._tableColumns = new Set(res.rows.map(r => r.column_name));
    } catch {
      this._tableColumns = new Set();
    }
    return this._tableColumns;
  }

  async create(data) {
    const validCols = await this.getTableColumns();
    const colMap = new Map();

    for (const [key, val] of Object.entries(data)) {
      if (key === '_id' || key === 'id') continue;
      const col = this.mapFieldToColumn(key);
      if (validCols.size > 0 && !validCols.has(col)) continue;

      let cleanVal = val;
      if (cleanVal && typeof cleanVal === 'object' && !(cleanVal instanceof Date)) {
        if (cleanVal.id || cleanVal._id) {
          cleanVal = cleanVal.id || cleanVal._id;
        } else if (Array.isArray(cleanVal) || typeof cleanVal === 'object') {
          cleanVal = JSON.stringify(cleanVal);
        }
      }
      colMap.set(col, cleanVal === undefined ? null : cleanVal);
    }

    const cols = [];
    const placeholders = [];
    const values = [];
    let paramIndex = 1;

    for (const [col, val] of colMap.entries()) {
      cols.push(col);
      placeholders.push(`$${paramIndex++}`);
      values.push(val);
    }

    const sql = `
      INSERT INTO ${this.tableName} (${cols.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *;
    `;

    const res = await pool.query(sql, values);
    return this.createDocument(res.rows[0]);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    if (!id) return null;
    return await this.findOneAndUpdate({ id: String(id) }, update, options);
  }

  async findOneAndUpdate(filter, update, options = {}) {
    const existing = await this.findOne(filter);
    if (!existing) {
      if (options.upsert) {
        return await this.create({ ...filter, ...update });
      }
      return null;
    }

    const updateData = update.$set ? { ...update.$set } : { ...update };
    const validCols = await this.getTableColumns();
    const colMap = new Map();

    for (const [key, val] of Object.entries(updateData)) {
      if (key === '_id' || key === 'id' || key.startsWith('$')) continue;
      const col = this.mapFieldToColumn(key);
      if (validCols.size > 0 && !validCols.has(col)) continue;

      let cleanVal = val;
      if (cleanVal && typeof cleanVal === 'object' && !(cleanVal instanceof Date)) {
        if (cleanVal.id || cleanVal._id) {
          cleanVal = cleanVal.id || cleanVal._id;
        } else if (Array.isArray(cleanVal) || typeof cleanVal === 'object') {
          cleanVal = JSON.stringify(cleanVal);
        }
      }
      colMap.set(col, cleanVal === undefined ? null : cleanVal);
    }

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [col, val] of colMap.entries()) {
      setClauses.push(`${col} = $${paramIndex++}`);
      values.push(val);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(existing.id);

    const sql = `
      UPDATE ${this.tableName}
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    const res = await pool.query(sql, values);
    return this.createDocument(res.rows[0]);
  }

  async findByIdAndDelete(id) {
    if (!id) return null;
    const res = await pool.query(`DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`, [String(id)]);
    return res.rows.length > 0 ? this.createDocument(res.rows[0]) : null;
  }

  async deleteOne(filter) {
    const existing = await this.findOne(filter);
    if (!existing) return { deletedCount: 0 };
    await pool.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [existing.id]);
    return { deletedCount: 1 };
  }

  async deleteMany(filter) {
    // Basic delete
    const res = await pool.query(`DELETE FROM ${this.tableName}`);
    return { deletedCount: res.rowCount };
  }

  async saveDocument(doc) {
    const id = doc.id || doc._id;
    if (!id) {
      const created = await this.create(doc.toObject());
      Object.assign(doc, created);
      return doc;
    }

    const validCols = await this.getTableColumns();
    const colMap = new Map();
    const rawData = doc.toObject ? doc.toObject() : doc;

    for (const [key, val] of Object.entries(rawData)) {
      if (key === 'id' || key === '_id' || key === 'created_at' || key === 'createdAt' || key === 'updated_at' || key === 'updatedAt') continue;
      const col = this.mapFieldToColumn(key);
      if (validCols.size > 0 && !validCols.has(col)) continue;

      let cleanVal = val;
      if (cleanVal && typeof cleanVal === 'object' && !(cleanVal instanceof Date)) {
        if (cleanVal.id || cleanVal._id) {
          cleanVal = cleanVal.id || cleanVal._id;
        } else if (Array.isArray(cleanVal) || typeof cleanVal === 'object') {
          cleanVal = JSON.stringify(cleanVal);
        }
      }
      colMap.set(col, cleanVal === undefined ? null : cleanVal);
    }

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [col, val] of colMap.entries()) {
      setClauses.push(`${col} = $${paramIndex++}`);
      values.push(val);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `
      UPDATE ${this.tableName}
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    const res = await pool.query(sql, values);
    if (res.rows.length > 0) {
      Object.assign(doc, new Document(res.rows[0], this));
    }
    return doc;
  }
}

module.exports = {
  BaseModel,
  Document,
  QueryBuilder
};
