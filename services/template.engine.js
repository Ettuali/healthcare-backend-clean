// services/template.engine.js

/**
 * Replaces {{key}} placeholders in a string with values from `data`.
 */
const render = (template, data = {}) => {
    if (!template) return "";
    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
        const value = key.split(".").reduce((obj, k) => (obj == null ? undefined : obj[k]), data);
        return value !== undefined && value !== null ? String(value) : "";
    });
};

module.exports = { render };