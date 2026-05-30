const jwt = require('jwt-simple');

const verificarToken = (req, res, next) => {
  const tokenHeader = req.headers['authorization'];

  if (!tokenHeader) {
    return res.status(403).json({ message: 'Token no proporcionado.' });
  }

  try {
    // Extraer el token quitando el prefijo "Bearer "
    const token = tokenHeader.split(' ')[1] || tokenHeader;
    
    // Decodificar usando la misma librería jwt-simple y la firma secreta
    const decoded = jwt.decode(token, 'TU_FIRMA_SECRETA_JWT_AQUÍ');
    
    // Inyectamos el usuario decodificado en la petición (req.user)
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Error al validar token con jwt-simple:', error.message);
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

const permitirRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tienes permisos para acceder a este recurso.' });
    }
    next();
  };
};

module.exports = { verificarToken, permitirRoles };