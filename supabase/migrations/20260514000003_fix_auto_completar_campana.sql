-- Eliminar trigger y función que causaban fallo en cascada al insertar respuestas.
-- La lógica se maneja ahora en la capa de aplicación.
DROP TRIGGER IF EXISTS trg_auto_completar_campana ON encuestas;
DROP FUNCTION IF EXISTS fn_auto_completar_campana();
