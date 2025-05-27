import prisma from '../utils/db';

export async function identifyContact(email?: string, phoneNumber?: string) {
  const initialMatches = await prisma.contact.findMany({
    where: {
      OR: [
        email ? { email } : undefined,
        phoneNumber ? { phoneNumber } : undefined
      ].filter(Boolean) as any
    },
    orderBy: { createdAt: 'asc' }
  });

  if (initialMatches.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: 'primary'
      }
    });

    return {
      contact: {
        primaryContatctId: newContact.id,
        emails: [email].filter(Boolean),
        phoneNumbers: [phoneNumber].filter(Boolean),
        secondaryContactIds: []
      }
    };
  }
  const visited = new Set<number>();
  const queue: number[] = [];

  for (const contact of initialMatches) {
    queue.push(contact.id);
    if (contact.linkedId) queue.push(contact.linkedId);
  }

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id || visited.has(id)) continue;
    visited.add(id);

    const links = await prisma.contact.findMany({
      where: {
        OR: [{ id }, { linkedId: id }]
      }
    });

    for (const link of links) {
      if (!visited.has(link.id)) queue.push(link.id);
      if (link.linkedId && !visited.has(link.linkedId)) queue.push(link.linkedId);
    }
  }

  const allContacts = await prisma.contact.findMany({
    where: {
      id: { in: Array.from(visited) }
    },
    orderBy: { createdAt: 'asc' }
  });

  const primaryContact = allContacts.reduce((prev, curr) => {
    if (prev.linkPrecedence === 'primary' && curr.linkPrecedence !== 'primary') return prev;
    if (curr.linkPrecedence === 'primary' && prev.linkPrecedence !== 'primary') return curr;
    return prev.createdAt < curr.createdAt ? prev : curr;
  });
  const updatePromises = allContacts
    .filter(c => c.id !== primaryContact.id && c.linkPrecedence === 'primary')
    .map(c =>
      prisma.contact.update({
        where: { id: c.id },
        data: {
          linkPrecedence: 'secondary',
          linkedId: primaryContact.id
        }
      })
    );

  await Promise.all(updatePromises);
  const emailExists = email && allContacts.some(c => c.email === email);
  const phoneExists = phoneNumber && allContacts.some(c => c.phoneNumber === phoneNumber);
  const alreadyExists = (email ? emailExists : true) && (phoneNumber ? phoneExists : true);

  if (!alreadyExists && (email || phoneNumber)) {
    await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: 'secondary',
        linkedId: primaryContact.id
      }
    });

    return await identifyContact(email, phoneNumber);
  }

  const finalContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: primaryContact.id },
        { linkedId: primaryContact.id }
      ]
    }
  });

  const emails = Array.from(new Set(finalContacts.map(c => c.email).filter(Boolean)));
  const phoneNumbers = Array.from(new Set(finalContacts.map(c => c.phoneNumber).filter(Boolean)));
  const secondaryIds = finalContacts
    .filter(c => c.id !== primaryContact.id)
    .map(c => c.id);

  return {
    contact: {
      primaryContatctId: primaryContact.id,
      emails,
      phoneNumbers,
      secondaryContactIds: secondaryIds
    }
  };
}
