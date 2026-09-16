import { Router, type IRouter, type RequestHandler } from "express";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  activitiesTable,
  capturesTable,
  commissionsTable,
  leadsTable,
  propertiesTable,
  proposalsTable,
  tasksTable,
  visitsTable,
} from "@workspace/db";
import {
  CreateLeadBody,
  CreatePropertyBody,
  CreateTaskBody,
  CreateVisitBody,
  DeleteLeadParams,
  GetClientParams,
  GetDashboardResponse,
  GetLeadParams,
  GetLeadResponse,
  GetPropertyParams,
  GetPropertyResponse,
  GetReportsResponse,
  ListClientsQueryParams,
  ListClientsResponse,
  ListLeadsQueryParams,
  ListLeadsResponse,
  ListPropertiesQueryParams,
  ListPropertiesResponse,
  ListTasksQueryParams,
  ListTasksResponse,
  ListVisitsResponse,
  ListProposalsResponse,
  ListCapturesResponse,
  ListCommissionsResponse,
  ReceiveLeadWebhookBody,
  UpdateLeadBody,
  UpdateLeadParams,
  UpdatePropertyBody,
  UpdatePropertyParams,
  UpdateTaskBody,
  UpdateTaskParams,
} from "@workspace/api-zod";

const router: IRouter = Router();
const TODAY = new Date().toISOString().slice(0, 10);
let seeded = false;
const requireAuth: RequestHandler = (req, res, next) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};

const leadSeeds = [
  ["Marina Alves", "(79) 99124-3088", "Instagram", "Apartamento", 680000, "Quente", "Qualificado", "Jardins, 13 de Julho"],
  ["Rafael Menezes", "(79) 99872-1140", "Indicação", "Casa", 920000, "Morno", "Primeiro Contato", "Aruana, Atalaia"],
  ["Bianca Oliveira", "(79) 98831-5502", "WhatsApp", "Apartamento", 420000, "Quente", "Visita Agendada", "Grageru, Luzia"],
  ["Carlos Henrique", "(79) 99921-4801", "OLX", "Terreno", 250000, "Frio", "Sem Resposta", "São Conrado"],
  ["Juliana Santos", "(79) 99103-7288", "Site", "Casa", 1150000, "Quente", "Proposta", "Jardins"],
  ["Pedro Nascimento", "(79) 99712-0495", "Google", "Apartamento", 530000, "Morno", "Imóvel Apresentado", "Coroa do Meio"],
  ["Ana Beatriz", "(79) 98101-4477", "Instagram", "Cobertura", 1450000, "Quente", "Negociação", "13 de Julho"],
  ["Lucas Costa", "(79) 99221-8791", "Facebook", "Comercial", 780000, "Morno", "Novo Lead", "Centro"],
];

const dateOffset = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

async function ensureSeed(): Promise<void> {
  if (seeded) return;
  const existing = await db.select({ id: leadsTable.id }).from(leadsTable).limit(1);
  if (existing.length === 0) {
    await db.insert(leadsTable).values(
      leadSeeds.map((seed, index) => ({
        name: seed[0] as string,
        phone: seed[1] as string,
        source: seed[2] as string,
        interest: seed[3] as string,
        budget: seed[4] as number,
        temperature: seed[5] as string,
        stage: seed[6] as string,
        neighborhoods: (seed[7] as string).split(", "),
        lastContact: dateOffset(-index - 1),
        nextContact: index % 3 === 0 ? dateOffset(index - 1) : dateOffset(index + 1),
        city: "Aracaju",
        email: `${(seed[0] as string).toLowerCase().replaceAll(" ", ".")}@example.com`,
        notes: index % 2 === 0 ? "Busca atendimento rápido e visita aos finais de semana." : null,
      })),
    );
  }
  const properties = await db.select({ id: propertiesTable.id }).from(propertiesTable).limit(1);
  if (properties.length === 0) {
    await db.insert(propertiesTable).values([
      { code: "AP-1042", title: "Apartamento Jardins com varanda", type: "Apartamento", purpose: "Venda", price: 680000, city: "Aracaju", neighborhood: "Jardins", address: "Av. Ministro Geraldo Barreto Sobral", bedrooms: 3, suites: 1, bathrooms: 3, parking: 2, area: 118, image: "", ownerName: "Eduardo Menezes", commission: 5, exclusive: true, description: "Planta confortável, ventilação cruzada e lazer completo.", features: ["Varanda gourmet", "Piscina", "Academia"] },
      { code: "CA-2178", title: "Casa térrea próxima à praia", type: "Casa", purpose: "Venda", price: 920000, city: "Aracaju", neighborhood: "Aruana", address: "Rua das Dunas", bedrooms: 4, suites: 2, bathrooms: 4, parking: 3, area: 240, image: "", ownerName: "Helena Carvalho", commission: 6, exclusive: false, description: "Casa ampla com jardim e espaço para receber.", features: ["Jardim", "Churrasqueira", "Energia solar"] },
      { code: "AP-0981", title: "Apartamento vista mar Atalaia", type: "Apartamento", purpose: "Venda", price: 530000, city: "Aracaju", neighborhood: "Atalaia", address: "Av. Oceânica, 860", bedrooms: 2, suites: 1, bathrooms: 2, parking: 1, area: 82, image: "", ownerName: "Marcelo Duarte", commission: 5, exclusive: false, description: "Vista aberta para o mar em condomínio com lazer.", features: ["Vista mar", "Elevador", "Portaria 24h"] },
      { code: "CB-3307", title: "Cobertura duplex 13 de Julho", type: "Cobertura", purpose: "Venda", price: 1450000, city: "Aracaju", neighborhood: "13 de Julho", address: "Rua Jornalista João Batista", bedrooms: 4, suites: 3, bathrooms: 5, parking: 4, area: 286, image: "", ownerName: "Patrícia Andrade", commission: 5, exclusive: true, description: "Cobertura com terraço privativo e acabamentos premium.", features: ["Terraço", "Piscina privativa", "4 vagas"] },
      { code: "AP-4432", title: "Apartamento compacto Grageru", type: "Apartamento", purpose: "Venda", price: 420000, city: "Aracaju", neighborhood: "Grageru", address: "Rua Delmiro Gouveia", bedrooms: 2, suites: 0, bathrooms: 2, parking: 1, area: 68, image: "", ownerName: "Marta Lima", commission: 5, exclusive: false, description: "Boa localização e condomínio com área verde.", features: ["Área verde", "Salão de festas", "Pet friendly"] },
      { code: "CO-5509", title: "Sala comercial no Centro", type: "Comercial", purpose: "Venda", price: 780000, city: "Aracaju", neighborhood: "Centro", address: "Rua João Pessoa", bedrooms: 0, suites: 0, bathrooms: 2, parking: 2, area: 132, image: "", ownerName: "Júlio Martins", commission: 4, exclusive: false, description: "Sala comercial pronta para consultórios e escritórios.", features: ["Recepção", "Ar condicionado", "2 vagas"] },
    ]);
  }
  const tasks = await db.select({ id: tasksTable.id }).from(tasksTable).limit(1);
  if (tasks.length === 0) {
    await db.insert(tasksTable).values([
      { title: "Retornar mensagem de Marina", type: "WhatsApp", scheduledDate: dateOffset(-1), time: "09:30", priority: "Alta", status: "Pendente", clientName: "Marina Alves" },
      { title: "Enviar opções de apartamento", type: "Follow-up", scheduledDate: TODAY, time: "11:00", priority: "Média", status: "Pendente", clientName: "Pedro Nascimento" },
      { title: "Confirmar visita com Bianca", type: "Visita", scheduledDate: TODAY, time: "14:30", priority: "Alta", status: "Pendente", clientName: "Bianca Oliveira", propertyTitle: "Apartamento Grageru" },
      { title: "Atualizar documentação da proposta", type: "Documentação", scheduledDate: dateOffset(1), time: "16:00", priority: "Média", status: "Pendente", clientName: "Juliana Santos" },
      { title: "Ligar para proprietário", type: "Captação", scheduledDate: dateOffset(2), time: "10:00", priority: "Baixa", status: "Concluída", clientName: "Eduardo Menezes" },
    ]);
  }
  const visits = await db.select({ id: visitsTable.id }).from(visitsTable).limit(1);
  if (visits.length === 0) {
    await db.insert(visitsTable).values([
      { clientName: "Bianca Oliveira", propertyTitle: "Apartamento compacto Grageru", scheduledDate: TODAY, time: "14:30", status: "Confirmada", location: "Grageru, Aracaju" },
      { clientName: "Juliana Santos", propertyTitle: "Apartamento Jardins com varanda", scheduledDate: dateOffset(1), time: "10:00", status: "Agendada", location: "Jardins, Aracaju" },
      { clientName: "Rafael Menezes", propertyTitle: "Casa térrea próxima à praia", scheduledDate: dateOffset(3), time: "15:30", status: "Agendada", location: "Aruana, Aracaju" },
    ]);
  }
  const proposals = await db.select({ id: proposalsTable.id }).from(proposalsTable).limit(1);
  if (proposals.length === 0) {
    await db.insert(proposalsTable).values([
      { clientName: "Juliana Santos", propertyTitle: "Apartamento Jardins com varanda", advertisedValue: 680000, proposedValue: 640000, entry: 160000, status: "Em análise", validUntil: dateOffset(6) },
      { clientName: "Ana Beatriz", propertyTitle: "Cobertura duplex 13 de Julho", advertisedValue: 1450000, proposedValue: 1380000, entry: 400000, status: "Contraproposta", validUntil: dateOffset(2) },
      { clientName: "Rafael Menezes", propertyTitle: "Casa térrea próxima à praia", advertisedValue: 920000, proposedValue: 900000, entry: 250000, status: "Enviada", validUntil: dateOffset(9) },
    ]);
  }
  const captures = await db.select({ id: capturesTable.id }).from(capturesTable).limit(1);
  if (captures.length === 0) {
    await db.insert(capturesTable).values([
      { ownerName: "Eduardo Menezes", propertyTitle: "Apartamento Jardins com varanda", stage: "Imóvel captado", askingValue: 680000, suggestedValue: 695000, nextFollowUp: dateOffset(4), exclusive: true },
      { ownerName: "Helena Carvalho", propertyTitle: "Casa térrea próxima à praia", stage: "Avaliação", askingValue: 960000, suggestedValue: 920000, nextFollowUp: dateOffset(2), exclusive: false },
      { ownerName: "Roberto Alves", propertyTitle: "Terreno Santa Lúcia", stage: "Primeiro contato", askingValue: 320000, suggestedValue: null, nextFollowUp: dateOffset(1), exclusive: false },
    ]);
  }
  const commissions = await db.select({ id: commissionsTable.id }).from(commissionsTable).limit(1);
  if (commissions.length === 0) {
    await db.insert(commissionsTable).values([
      { clientName: "Fernanda Reis", propertyTitle: "Casa condomínio Bosque", soldValue: 840000, percentage: 5, gross: 42000, net: 29400, expectedDate: dateOffset(5), receivedDate: null, status: "A receber" },
      { clientName: "Gustavo Lima", propertyTitle: "Apartamento Luzia", soldValue: 490000, percentage: 5, gross: 24500, net: 17150, expectedDate: dateOffset(-12), receivedDate: dateOffset(-2), status: "Recebida" },
      { clientName: "Carolina Melo", propertyTitle: "Sala comercial Jardins", soldValue: 610000, percentage: 4, gross: 24400, net: 17080, expectedDate: dateOffset(14), receivedDate: null, status: "Prevista" },
    ]);
  }
  if (!seeded) {
    await db.insert(activitiesTable).values([
      { kind: "lead", title: "Novo lead recebido", description: "Marina Alves chegou pelo Instagram", entityId: 1 },
      { kind: "visit", title: "Visita confirmada", description: "Bianca Oliveira confirmou a visita no Grageru", entityId: 1 },
      { kind: "proposal", title: "Proposta em análise", description: "Juliana Santos enviou uma proposta para o apartamento Jardins", entityId: 1 },
      { kind: "capture", title: "Captação atualizada", description: "Casa térrea próxima à praia avançou para avaliação", entityId: 2 },
    ]);
  }
  seeded = true;
}

const iso = (value: Date | null) => value ? value.toISOString() : "";
const mapLead = (lead: typeof leadsTable.$inferSelect) => ({
  ...lead,
  createdAt: iso(lead.createdAt),
  updatedAt: undefined,
});
const mapProperty = (property: typeof propertiesTable.$inferSelect) => ({
  ...property,
  createdAt: iso(property.createdAt),
  updatedAt: undefined,
  matchScore: null,
});
const mapTask = (task: typeof tasksTable.$inferSelect) => ({
  id: task.id, title: task.title, description: task.description, type: task.type,
  date: task.scheduledDate, time: task.time, priority: task.priority, status: task.status,
  clientName: task.clientName, propertyTitle: task.propertyTitle, ownerName: task.ownerName,
});
const mapVisit = (visit: typeof visitsTable.$inferSelect) => ({
  id: visit.id, clientName: visit.clientName, propertyTitle: visit.propertyTitle,
  date: visit.scheduledDate, time: visit.time, status: visit.status, location: visit.location, feedback: visit.feedback,
});
const mapProposal = (proposal: typeof proposalsTable.$inferSelect) => proposal;
const mapCapture = (capture: typeof capturesTable.$inferSelect) => capture;
const mapCommission = (commission: typeof commissionsTable.$inferSelect) => commission;

router.get("/dashboard", async (_req, res): Promise<void> => {
  await ensureSeed();
  const [leads, visits, tasks, proposals, commissions] = await Promise.all([
    db.select().from(leadsTable).orderBy(desc(leadsTable.createdAt)),
    db.select().from(visitsTable).orderBy(asc(visitsTable.scheduledDate)),
    db.select().from(tasksTable).orderBy(asc(tasksTable.scheduledDate)),
    db.select().from(proposalsTable).orderBy(desc(proposalsTable.createdAt)),
    db.select().from(commissionsTable).orderBy(desc(commissionsTable.createdAt)),
  ]);
  const sourceCounts = new Map<string, number>();
  const stageCounts = new Map<string, number>();
  for (const lead of leads) {
    sourceCounts.set(lead.source, (sourceCounts.get(lead.source) ?? 0) + 1);
    stageCounts.set(lead.stage, (stageCounts.get(lead.stage) ?? 0) + 1);
  }
  const expectedCommission = commissions.filter((item) => item.status !== "Recebida").reduce((sum, item) => sum + item.net, 0);
  const receivedCommission = commissions.filter((item) => item.status === "Recebida").reduce((sum, item) => sum + item.net, 0);
  const data = {
    stats: {
      newLeads: leads.filter((lead) => lead.createdAt.toISOString().slice(0, 10) >= dateOffset(-7)).length,
      activeLeads: leads.filter((lead) => lead.status === "Ativo").length,
      noReturn: leads.filter((lead) => lead.stage === "Sem Resposta").length,
      scheduledVisits: visits.filter((visit) => visit.status === "Agendada" || visit.status === "Confirmada").length,
      openProposals: proposals.filter((proposal) => !["Aceita", "Recusada", "Cancelada"].includes(proposal.status)).length,
      closedSales: commissions.length,
      vgv: commissions.reduce((sum, item) => sum + item.soldValue, 0),
      potentialValue: proposals.reduce((sum, item) => sum + item.proposedValue, 0),
      expectedCommission,
      receivedCommission,
      overdueFollowUps: tasks.filter((task) => task.status !== "Concluída" && task.scheduledDate < TODAY).length,
      conversionRate: leads.length ? Number(((commissions.length / leads.length) * 100).toFixed(1)) : 0,
    },
    funnel: [
      ["Novo Lead", "#6B7CFF"], ["Primeiro Contato", "#8C78F5"], ["Qualificado", "#A66BE8"],
      ["Visita Agendada", "#CA65D1"], ["Proposta", "#E369B8"], ["Negociação", "#F17A9B"],
      ["Venda Fechada", "#F59A72"],
    ].map(([label, color]) => ({ label, color, value: stageCounts.get(label) ?? 0 })),
    sources: [...sourceCounts.entries()].map(([label, value]) => ({ label, value })),
    monthly: [
      { month: "Abr", sales: 1, vgv: 490000 }, { month: "Mai", sales: 2, vgv: 980000 },
      { month: "Jun", sales: 1, vgv: 610000 }, { month: "Jul", sales: 2, vgv: 1240000 },
      { month: "Ago", sales: 1, vgv: 840000 }, { month: "Set", sales: commissions.length, vgv: commissions.reduce((sum, item) => sum + item.soldValue, 0) },
    ],
    nextVisits: visits.slice(0, 4).map(mapVisit),
    overdueTasks: tasks.filter((task) => task.status !== "Concluída" && task.scheduledDate <= TODAY).slice(0, 4).map(mapTask),
    latestLeads: leads.slice(0, 5).map(mapLead),
    commissions: commissions.slice(0, 4).map(mapCommission),
  };
  res.json(GetDashboardResponse.parse(data));
});

router.get("/activity", async (_req, res): Promise<void> => {
  await ensureSeed();
  const rows = await db.select().from(activitiesTable).orderBy(desc(activitiesTable.createdAt)).limit(8);
  res.json(rows.map((item) => ({ ...item, createdAt: iso(item.createdAt), updatedAt: undefined })));
});

router.get("/leads", async (req, res): Promise<void> => {
  await ensureSeed();
  const query = ListLeadsQueryParams.parse(req.query);
  const conditions = [];
  if (query.search) conditions.push(or(ilike(leadsTable.name, `%${query.search}%`), ilike(leadsTable.phone, `%${query.search}%`), ilike(leadsTable.interest, `%${query.search}%`)));
  if (query.status) conditions.push(eq(leadsTable.status, query.status));
  const rows = await db.select().from(leadsTable).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(leadsTable.createdAt));
  const page = query.page ?? 1;
  const items = rows.slice((page - 1) * 20, page * 20).map(mapLead);
  res.json(ListLeadsResponse.parse({ items, total: rows.length, page }));
});

router.post("/leads", requireAuth, async (req, res): Promise<void> => {
  const body = CreateLeadBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const [lead] = await db.insert(leadsTable).values({
    ...body.data,
    lastContact: TODAY,
    nextContact: dateOffset(1),
    neighborhoods: body.data.neighborhoods ?? [],
  }).returning();
  await db.insert(activitiesTable).values({ kind: "lead", title: "Novo lead criado", description: `${lead.name} foi adicionado ao CRM`, entityId: lead.id });
  res.status(201).json(GetLeadResponse.parse(mapLead(lead)));
});

router.get("/leads/:id", async (req, res): Promise<void> => {
  await ensureSeed();
  const params = GetLeadParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, params.data.id));
  if (!lead) { res.status(404).json({ error: "Lead não encontrado" }); return; }
  res.json(GetLeadResponse.parse(mapLead(lead)));
});

router.patch("/leads/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateLeadParams.safeParse(req.params);
  const body = UpdateLeadBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Dados inválidos" }); return; }
  const [lead] = await db.update(leadsTable).set(body.data).where(eq(leadsTable.id, params.data.id)).returning();
  if (!lead) { res.status(404).json({ error: "Lead não encontrado" }); return; }
  res.json(GetLeadResponse.parse(mapLead(lead)));
});

router.delete("/leads/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteLeadParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [lead] = await db.delete(leadsTable).where(eq(leadsTable.id, params.data.id)).returning();
  if (!lead) { res.status(404).json({ error: "Lead não encontrado" }); return; }
  res.sendStatus(204);
});

router.get("/clients", async (req, res): Promise<void> => {
  await ensureSeed();
  const query = ListClientsQueryParams.parse(req.query);
  const conditions = query.search ? [or(ilike(leadsTable.name, `%${query.search}%`), ilike(leadsTable.phone, `%${query.search}%`))] : [];
  const rows = await db.select().from(leadsTable).where(conditions.length ? and(...conditions) : undefined);
  res.json(ListClientsResponse.parse(rows.filter((lead) => lead.stage !== "Novo Lead").map((lead) => ({ ...mapLead(lead), propertyCount: 3, matchScore: 96 }))));
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  await ensureSeed();
  const params = GetClientParams.parse(req.params);
  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, params.id));
  if (!lead) { res.status(404).json({ error: "Cliente não encontrado" }); return; }
  const properties = await db.select().from(propertiesTable).limit(4);
  const activities = await db.select().from(activitiesTable).orderBy(desc(activitiesTable.createdAt)).limit(8);
  res.json({
    ...mapLead(lead), propertyCount: properties.length, matchScore: 96,
    timeline: activities.map((item) => ({ ...item, createdAt: iso(item.createdAt), updatedAt: undefined })),
    recommendations: properties.map((property, index) => ({ ...mapProperty(property), matchScore: 96 - index * 4 })),
  });
});

router.get("/properties", async (req, res): Promise<void> => {
  await ensureSeed();
  const query = ListPropertiesQueryParams.parse(req.query);
  const conditions = [];
  if (query.search) conditions.push(or(ilike(propertiesTable.title, `%${query.search}%`), ilike(propertiesTable.neighborhood, `%${query.search}%`), ilike(propertiesTable.code, `%${query.search}%`)));
  if (query.status) conditions.push(eq(propertiesTable.status, query.status));
  if (query.type) conditions.push(eq(propertiesTable.type, query.type));
  const rows = await db.select().from(propertiesTable).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(propertiesTable.createdAt));
  res.json(ListPropertiesResponse.parse(rows.map(mapProperty)));
});

router.post("/properties", requireAuth, async (req, res): Promise<void> => {
  const body = CreatePropertyBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const [property] = await db.insert(propertiesTable).values({
    ...body.data,
    code: `IM-${Date.now().toString().slice(-4)}`,
    address: body.data.address ?? "",
    description: body.data.description ?? "",
    ownerName: body.data.ownerName ?? "",
    commission: body.data.commission ?? 5,
    features: [],
  }).returning();
  res.status(201).json(GetPropertyResponse.parse(mapProperty(property)));
});

router.get("/properties/:id", async (req, res): Promise<void> => {
  await ensureSeed();
  const params = GetPropertyParams.parse(req.params);
  const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, params.id));
  if (!property) { res.status(404).json({ error: "Imóvel não encontrado" }); return; }
  const clients = await db.select().from(leadsTable).limit(4);
  const activities = await db.select().from(activitiesTable).orderBy(desc(activitiesTable.createdAt)).limit(6);
  res.json({
    ...mapProperty(property), description: property.description, features: property.features,
    recommendations: clients.map((client, index) => ({ ...mapLead(client), propertyCount: 2, matchScore: 95 - index * 5 })),
    activities: activities.map((item) => ({ ...item, createdAt: iso(item.createdAt), updatedAt: undefined })),
  });
});

router.patch("/properties/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdatePropertyParams.safeParse(req.params);
  const body = UpdatePropertyBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Dados inválidos" }); return; }
  const [property] = await db.update(propertiesTable).set(body.data).where(eq(propertiesTable.id, params.data.id)).returning();
  if (!property) { res.status(404).json({ error: "Imóvel não encontrado" }); return; }
  res.json(GetPropertyResponse.parse(mapProperty(property)));
});

router.get("/tasks", async (req, res): Promise<void> => {
  await ensureSeed();
  const query = ListTasksQueryParams.parse(req.query);
  const rows = await db.select().from(tasksTable).orderBy(asc(tasksTable.scheduledDate), asc(tasksTable.time));
  const filtered = query.filter === "today" ? rows.filter((task) => task.scheduledDate === TODAY) :
    query.filter === "overdue" ? rows.filter((task) => task.scheduledDate < TODAY && task.status !== "Concluída") :
    query.filter === "tomorrow" ? rows.filter((task) => task.scheduledDate === dateOffset(1)) :
    query.filter === "completed" ? rows.filter((task) => task.status === "Concluída") : rows;
  res.json(ListTasksResponse.parse(filtered.map(mapTask)));
});

router.post("/tasks", requireAuth, async (req, res): Promise<void> => {
  const body = CreateTaskBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const [task] = await db.insert(tasksTable).values({
    title: body.data.title, description: body.data.description ?? null, type: body.data.type,
    scheduledDate: body.data.date, time: body.data.time ?? null, priority: body.data.priority,
    clientName: body.data.clientName ?? null, propertyTitle: body.data.propertyTitle ?? null,
  }).returning();
  res.status(201).json(mapTask(task));
});

router.patch("/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  const body = UpdateTaskBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Dados inválidos" }); return; }
  const [task] = await db.update(tasksTable).set({
    title: body.data.title, status: body.data.status, scheduledDate: body.data.date, priority: body.data.priority,
  }).where(eq(tasksTable.id, params.data.id)).returning();
  if (!task) { res.status(404).json({ error: "Tarefa não encontrada" }); return; }
  res.json(mapTask(task));
});

router.get("/visits", async (_req, res): Promise<void> => { await ensureSeed(); res.json(ListVisitsResponse.parse((await db.select().from(visitsTable).orderBy(asc(visitsTable.scheduledDate))).map(mapVisit))); });
router.post("/visits", requireAuth, async (req, res): Promise<void> => {
  const body = CreateVisitBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const [visit] = await db.insert(visitsTable).values({ clientName: body.data.clientName, propertyTitle: body.data.propertyTitle, scheduledDate: body.data.date, time: body.data.time, location: body.data.location, feedback: null }).returning();
  res.status(201).json(mapVisit(visit));
});
router.get("/proposals", async (_req, res): Promise<void> => { await ensureSeed(); res.json(ListProposalsResponse.parse((await db.select().from(proposalsTable).orderBy(desc(proposalsTable.createdAt))).map(mapProposal))); });
router.get("/captures", async (_req, res): Promise<void> => { await ensureSeed(); res.json(ListCapturesResponse.parse((await db.select().from(capturesTable).orderBy(desc(capturesTable.createdAt))).map(mapCapture))); });
router.get("/commissions", async (_req, res): Promise<void> => { await ensureSeed(); res.json(ListCommissionsResponse.parse((await db.select().from(commissionsTable).orderBy(desc(commissionsTable.createdAt))).map(mapCommission))); });

router.get("/reports", async (_req, res): Promise<void> => {
  await ensureSeed();
  const [leads, properties, visits, proposals, commissions] = await Promise.all([
    db.select().from(leadsTable), db.select().from(propertiesTable), db.select().from(visitsTable), db.select().from(proposalsTable), db.select().from(commissionsTable),
  ]);
  const count = (values: string[]) => [...new Set(values)].map((label) => ({ label, value: values.filter((value) => value === label).length }));
  res.json(GetReportsResponse.parse({
    sources: count(leads.map((lead) => lead.source)), stages: count(leads.map((lead) => lead.stage)),
    visits: visits.length, proposals: proposals.length, sales: commissions.length,
    neighborhoods: count(leads.flatMap((lead) => lead.neighborhoods)), propertyTypes: count(properties.map((property) => property.type)),
  }));
});

router.post("/webhooks/leads", async (req, res): Promise<void> => {
  const body = ReceiveLeadWebhookBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const [lead] = await db.insert(leadsTable).values({
    name: body.data.name, phone: body.data.phone, source: body.data.source, interest: body.data.interest ?? "A definir",
    budget: 0, city: "Aracaju", neighborhoods: [], lastContact: TODAY, nextContact: dateOffset(1), notes: body.data.message ?? null,
  }).returning();
  res.status(202).json(GetLeadResponse.parse(mapLead(lead)));
});

export default router;