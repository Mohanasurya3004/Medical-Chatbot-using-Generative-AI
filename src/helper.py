import os
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from sentence_transformers import SentenceTransformer
from langchain_huggingface import HuggingFaceEmbeddings

def load_pdf_file(data):
    loader = DirectoryLoader(
        data,
        glob="*.pdf",
        loader_cls=PyPDFLoader
    )
    documents = loader.load()
    return documents

def text_split(extracted_data):
            text_splitter=RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=20)
            text_chunks=text_splitter.split_documents(extracted_data)
            return text_chunks

#downladed embeddings model from kaggle

def load_local_embeddings():
        current_dir = os.path.dirname(os.path.abspath(__file__))
        embed_path = os.path.join(os.path.dirname(current_dir), "Embed")
        embeddings = HuggingFaceEmbeddings(
            model_name=embed_path
        )
        print("Model loaded successfully!")
        return embeddings
     

